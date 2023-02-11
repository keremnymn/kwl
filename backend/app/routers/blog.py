from datetime import datetime
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
    UploadFile,
    Form,
    File,
)
from fastapi.responses import ORJSONResponse

from data_models.users import UserInDB
from data_models.blog import NewTag
from utils.blog import (
    delete_from_bucket,
    check_if_admin,
    run_image_uploader,
    delete_from_editorjs_content,
)
from utils.constants import accepted_extensions
from main import get_db

import os, orjson

router = APIRouter(prefix="/api/blog", tags=["blog"])


@router.post("/upload-image", status_code=200, response_class=ORJSONResponse)
async def upload_image(
    file: UploadFile,
    request: Request,
    current_user: UserInDB = Depends(check_if_admin),
):

    _, ext = os.path.splitext(file.filename)

    if ext not in accepted_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Can not accept {ext} files",
        )
    s3_public_url = await run_image_uploader(request, file)
    return s3_public_url


@router.delete("/delete-image", status_code=200, response_class=ORJSONResponse)
async def delete_image(
    file: str,
    current_user: UserInDB = Depends(check_if_admin),
):
    await delete_from_bucket(file)
    return file


@router.get("/get-tags", status_code=200, response_class=ORJSONResponse)
async def get_tags(
    current_user: UserInDB = Depends(check_if_admin),
):
    command = """select label, value from tag;"""
    result = await get_db().fetch_rows(command)
    return result


@router.post("/add-new-tag", status_code=200, response_class=ORJSONResponse)
async def upload_article(
    newTag: NewTag, current_user: UserInDB = Depends(check_if_admin)
):
    command = """insert into tag (value, label) values($1, $2);"""
    await get_db().execute(command, newTag.value, newTag.label)
    return dict(newTag)


@router.post("/upload-article", status_code=200, response_class=ORJSONResponse)
async def upload_article(
    # can't use file and data model at the same time. have to use like this.
    request: Request,
    articleTitle: str = Form(),
    articleDescription: str = Form(),
    content: str = Form(),
    tags: str = Form(),
    mainImage: UploadFile = File(),
    current_user: UserInDB = Depends(check_if_admin),
):
    s3_public_url = await run_image_uploader(request, mainImage, "blog")
    command = """select * from add_article($1, $2, $3, $4, $5, $6);"""

    await get_db().execute(
        command,
        articleTitle,
        articleDescription,
        s3_public_url,
        content,
        tags.split(","),
        current_user.id,
    )
    return {}


@router.put("/modify-article", status_code=200, response_class=ORJSONResponse)
async def modify_article(
    request: Request,
    slug: str = Form(),
    date: str = Form(),
    articleTitle: str = Form(),
    articleDescription: str = Form(),
    content: str = Form(),
    tags: str = Form(),
    mainImage: UploadFile | None = File(default=None),
    current_user: UserInDB = Depends(check_if_admin),
):
    if mainImage.content_type == "image/webp":
        s3_public_url = await run_image_uploader(request, mainImage, "blog")
    else:
        s3_public_url = None

    command = """select * from update_article($1, $2, $3, $4, $5, $6, $7);"""

    await get_db().execute(
        command,
        slug,
        articleTitle,
        articleDescription,
        s3_public_url,
        content,
        tags.split(","),
        datetime.strptime(date, "%Y-%m-%d"),
    )
    return {}


@router.get("/get-articles", status_code=200, response_class=ORJSONResponse)
async def get_articles():
    command = """select title, slug, main_image, article_description, created_on from article order by id desc;"""
    result = await get_db().fetch_rows(command)
    return result


@router.get("/article/{date}/{slug}", status_code=200, response_class=ORJSONResponse)
async def get_article(date: str, slug: str):
    date = datetime.strptime(date, "%Y-%m-%d")
    command = """select 
                    title, 
                    slug, 
                    main_image, 
                    article_description, 
                    created_on, 
                    content,
                    array_agg(DISTINCT tag.label) as tags
                FROM article 
                LEFT JOIN article_tag
                ON article_tag.article_id = article.id
                LEFT JOIN  tag
                ON tag.id = article_tag.tag_id
                where date_trunc('day', created_on) = $1 and
                slug = $2
                GROUP BY article.id;"""
    result = await get_db().fetch_rows(command, date, slug)
    return result


@router.delete(
    "/delete-article/{date}/{slug}", status_code=200, response_class=ORJSONResponse
)
async def delete_article(
    date: str,
    slug: str,
    current_user: UserInDB = Depends(check_if_admin),
):
    date = datetime.strptime(date, "%Y-%m-%d")
    command = """select main_image, id, content 
                from article 
                where date_trunc('day', created_on) = $1 and 
                slug = $2;"""
    result = await get_db().fetch_rows(command, date, slug)
    result = dict(result[0])

    await delete_from_bucket(result["main_image"])

    content = orjson.loads(result["content"])
    await delete_from_editorjs_content(content)
    command = (
        """do $$
                declare
                    a_id int := %s;
                begin
                    delete from article_tag where article_id = a_id; 
                    delete from article where id = a_id;
                end $$;"""
        % result["id"]
    )
    await get_db().execute(command)
