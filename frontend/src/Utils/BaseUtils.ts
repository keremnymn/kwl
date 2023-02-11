import { PopUps } from "../App";

export const acceptedExtensions = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const fileChangedHandler = (event: React.ChangeEvent<HTMLInputElement>, props:PopUps, previewImage: React.MutableRefObject<HTMLImageElement | null>, callBackImage: string
) => {
  if (event.currentTarget.files?.length) {
      let file_size = event.currentTarget.files[0].size;
      let error: boolean = false;
      if (file_size > 2000000) {
        props.setAlert({
          message: "You can't upload a file larger than 2MB.",
          type: "error",
          isOpen: true,
        });
        error = true;
      }
      let file_type = event.currentTarget.files[0].type;
      if (!acceptedExtensions.includes(file_type)) {
        props.setAlert({
          message: `You can't upload a file with extension: ${file_type}`,
          type: "error",
          isOpen: true,
        });
        error = true;
      }
      if (error) {
        event.currentTarget.value = "";
        (previewImage.current as HTMLImageElement).src = callBackImage;
        throw "Error"
      } else {
        (previewImage.current as HTMLImageElement).src = URL.createObjectURL(
          event.currentTarget.files[0]
        );
      }
    }
}

export function truncateString(str: string, num = 30): string {
    if (str.length > num) {
      return str.slice(0, num) + "...";
    } else {
      return str;
    }
  }