from genericpath import isfile
import aioboto3, aiofiles, os
from datetime import datetime
from PIL import Image

from main import get_settings, Settings
from fastapi import status, HTTPException, Depends, UploadFile, Request

from utils.users import get_current_user
from utils.constants import s3_public_head, region_name
from data_models.users import UserInDB


async def check_if_admin(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized for this action.",
        )
    return current_user


async def delete_from_bucket(
    file: str,
    settings: Settings = get_settings(),
    bucket: str = f"kwl-app",
) -> str:
    session = aioboto3.Session(
        aws_access_key_id=settings.aws_access_key,
        aws_secret_access_key=settings.aws_secret_key,
        region_name=region_name,
    )
    async with session.resource("s3") as s3:
        try:
            bucket = await s3.Bucket(bucket)
            file_key = file.split(s3_public_head)
            await bucket.objects.filter(Prefix=file_key[1]).delete()
            print(f"Deleted file with key {file_key[1]}")
        except Exception as e:
            print(e)
            raise e


class ImageUploader:
    def __init__(
        self,
        app_url: str,
        file: UploadFile,
        settings: Settings = get_settings(),
        inner_directory: str | None = None,
    ):
        self.file: UploadFile = file
        self.settings: Settings = settings
        self.bucket: str = "kwl-app"
        self.environment = "l" if "localhost" in app_url else "p"
        self.address = os.path.join(os.getcwd(), "app", "temp", file.filename)

        if inner_directory:
            self.s3_key = f"{self.environment}/{inner_directory}/"
        else:
            self.s3_key = f"{self.environment}/"

    async def start_uploading(self) -> str:
        await self.write_file_temporarily()
        new_address = await self.convert_to_webp()

        # change the address with original file's name with the ${timestamp}.webp
        self.address = new_address
        self.s3_key += os.path.basename(new_address)

        public_s3_url = await self.upload_to_bucket()
        return public_s3_url

    async def convert_to_webp(self) -> os.PathLike:
        temp_folder = os.path.join(os.getcwd(), "app", "temp")
        timestamp = datetime.timestamp(datetime.now())
        new_address = os.path.join(
            temp_folder, str(timestamp).replace(".", "") + ".webp"
        )

        webp_address = self.address
        if not self.address.endswith(".webp"):
            split = os.path.splitext(self.address)
            webp_address = split[0] + ".webp"

            im = Image.open(self.address)
            im.save(webp_address, "webp")

        os.rename(webp_address, new_address)

        if os.path.isfile(self.address):
            os.remove(self.address)

        return new_address

    async def write_file_temporarily(self) -> None:
        async with aiofiles.open(self.address, "wb") as out_file:
            content = await self.file.read()
            await out_file.write(content)

    async def upload_to_bucket(
        self,
        extension: str = "webp",
    ) -> str:
        session = aioboto3.Session(
            aws_access_key_id=self.settings.aws_access_key,
            aws_secret_access_key=self.settings.aws_secret_key,
            region_name=region_name,
        )
        async with session.client("s3") as s3:
            try:
                async with aiofiles.open(self.address, "rb") as file:
                    print(f"Uploading {self.s3_key} to s3")
                    await s3.upload_fileobj(
                        file,
                        self.bucket,
                        self.s3_key,
                        ExtraArgs={
                            "ACL": "public-read",
                            "CacheControl": "max-age=2000000,public",
                            "Expires": "2050-09-01T00:00:00Z",
                            "ContentType": f"image/{extension}",
                        },
                    )
                    print(f"Finished Uploading {self.s3_key} to s3")
                    os.remove(self.address)
            except Exception as e:
                print(
                    f"Unable to s3 upload {self.address} to {self.s3_key}: {e} ({type(e)})"
                )
                raise e
        return s3_public_head + self.s3_key


async def run_image_uploader(
    request: Request,
    file: UploadFile,
    inner_directory: str | None = None,
) -> str:
    i = ImageUploader(str(request.url), file, inner_directory=inner_directory)
    s3_public_url = await i.start_uploading()
    return s3_public_url


async def delete_from_editorjs_content(content: dict):
    for block in content["blocks"]:
        if "file" in block["data"]:
            await delete_from_bucket(block["data"]["file"]["url"])
