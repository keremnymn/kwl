from config import Settings
from utils.mails import dispatch_email_info
import asyncio, asyncpg
from datetime import datetime
from utils import constants


async def connect_to_db():
    settings = Settings()
    config = settings.db_connection

    db = await asyncpg.connect(
        f'postgresql://{config["user"]}:{config["password"]}@{config["host"]}/{config["db"]}'
    )
    return db, settings.api_address


async def send_mails():
    db, api_address = await connect_to_db()

    # take the tickets which they have to be reminded today and store them in result variable
    command = """select "user".email, "ticket".id 
                from "user", "ticket" 
                where 
                    remind_date = (select(cast(now() as date)))
                        and 
                    "ticket".user_id = "user".id;"""
    result: list = await db.fetch(command)

    # change tickets' dates to null after extracting them
    change_dates_command = """update ticket set remind_date = null where remind_date = (select(cast(now() as date)));"""
    await db.execute(change_dates_command)

    # close the connection
    await db.close()

    if result:
        mails_to_send_today = [dict(record) for record in result]

        for to_send in mails_to_send_today:
            url = f"{api_address}ticket/{to_send['id']}"
            dispatch_email_info(to_send["email"], url, "ticketReminder")
            print(datetime.now().strftime(constants.date_to_str), to_send)

    return result


if __name__ == "__main__":
    asyncio.run(send_mails())
