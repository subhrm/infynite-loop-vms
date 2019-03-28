import os
import mysql.connector

from vm_desktop_app import config, logger


def get_connection():
    logger.info("Trying to connect to MySQL database")

    cnx = None

    try:
        uid = os.environ.get("SQL_SERVER_USER_ID")
        pwd = os.environ.get("SQL_SERVER_USER_PWD")
        # print(uid, pwd)
        cnx = mysql.connector.connect(host=config.SQL_SERVER_IP,
                                      port=config.SQL_SERVER_PORT,
                                      user=uid,
                                      password=pwd,
                                      database=config.DB_NAME)
    except Exception:
        logger.exception("SQL Connection failed")
        exit(1)

    return cnx


def get_all_visitor_photos():
    '''
        Get photos of all visitors
    '''

    logger.info("Trying to fetch all visitor images")

    cnx = get_connection()

    try:
        cursor = cnx.cursor()
        query = '''
            select v.name, i.image_data
            from visitor v,
                images i
            where v.status = 1 
            and v.actual_photo is not null
            and  v.actual_photo = i.image_id;
        '''
        cursor.execute(query)
        res = cursor.fetchall()
        resp = []
        for row in res:
            resp.append(row)
        cursor.close()
        cnx.close()
    except Exception as ex:
        logger.exception(str(ex))
        raise Exception("Some thing went wrong")

    return resp
