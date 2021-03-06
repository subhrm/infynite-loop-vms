
class Config():
    '''
        Define all global constants using the CONFIG.json file
    '''

    def __init__(self):
        self.DATA_DIR = "./data"
        self.FACE_CASCADE_MODELS = [
            "haarcascade_profileface.xml",
            "haarcascade_frontalface_alt.xml",
            "haarcascade_frontalface_alt_tree.xml"
        ]

        self.SQL_SERVER_IP = "35.207.12.149"
        self.SQL_SERVER_PORT = "8306"
        self.DB_NAME = "vms"
