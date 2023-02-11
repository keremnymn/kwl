from pydantic import BaseModel
from config import Settings
from main import get_settings
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import os, smtplib, multiprocessing, orjson

mail_utils_path = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "mail_utils"
)


class EmailSchema(BaseModel):
    send_to: list[str]
    subject: str
    replace: list[list]
    message: str


class Email:
    def __init__(self):
        settings: Settings = get_settings()
        self.smtp_user = settings.mail_settings["username"]
        self.smtp_password = settings.mail_settings["password"]
        self.server = settings.mail_settings["server"]
        self.port = (465, 587)
        self.msg = MIMEMultipart("alternative")

    def send_email(self, email: EmailSchema, body: str, port_index: int = 0):
        self.msg["Subject"] = email.subject
        self.msg["From"] = self.smtp_user
        self.msg["To"] = email.send_to[0]
        self.msg.attach(MIMEText(email.message, "plain"))
        self.msg.attach(MIMEText(body, "html"))
        s = smtplib.SMTP_SSL(self.server, self.port[port_index])
        s.ehlo()

        if port_index:
            # not necessary anymore but leaving just in case
            s.starttls()

        s.login(self.smtp_user, self.smtp_password)
        s.sendmail(self.smtp_user, email.send_to[0], self.msg.as_string())
        s.close()

    def mail_supervisor(self, p: multiprocessing.Process) -> bool:
        p.start()
        p.join(5)

        if p.is_alive():
            p.terminate()
            return False

        return True

    def try_to_send(self, email: EmailSchema):
        html_path = os.path.join(mail_utils_path, "mail_template.html")

        with open(html_path, "r") as f:
            body = f.read()

        for to_replace in email.replace:
            body = body.replace(to_replace[0], to_replace[1])

        retry = 4

        while retry:
            p = multiprocessing.Process(target=self.send_email, args=(email, body))
            result = self.mail_supervisor(p)

            if not result:
                retry -= 1
            else:
                break


def extract_mail_info(jsonKey: str) -> dict:
    mail_info = os.path.join(mail_utils_path, "mailInfo.json")

    with open(mail_info, "r") as f:
        f = f.read()

    mail_info = orjson.loads(f)
    return mail_info[jsonKey]


def define_replacements(url: str, info: dict) -> list:
    return [
        [f'href="#">**-button-**', f'href="{url}">{info["buttonKey"]}'],
        [info["icon"][0], info["icon"][1]],
        [info["title"][0], info["title"][1]],
        [info["mainText"][0], info["mainText"][1]],
        [info["hiddenText"][0], info["hiddenText"][1]],
    ]


def dispatch_email_info(send_to: str, url: str, jsonKey: str) -> bool:
    info = extract_mail_info(jsonKey)

    email = EmailSchema(
        send_to=[send_to],
        subject=info["subject"],
        replace=define_replacements(url, info),
        message=info["message"],
    )

    Email().try_to_send(email)

    return True
