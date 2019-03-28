import os
import numpy as np
import cv2
from . import sql_utils, image_utils
from time import time
from vm_desktop_app import logger
from vm_desktop_app.models import FM


def get_active_visitor_photos():
    resp = sql_utils.get_all_visitor_photos()

    names = [r[0] for r in resp]
    logger.info("#of  active visitors found : %d", len(names))
    logger.info("active visitors found : %s", " | ".join(names))

    # visitor_faces = np.vstack([image_utils.read_b64(
    #     v[1]).reshape((1, 224, 224, 3)) for v in resp])

    # logger.info("visitor faces shape %s", str(visitor_faces.shape))

    # visitor_vectors = FM.vectorize(visitor_faces)

    # logger.info("Visitor Vectors.shape : %s", str(visitor_vectors.shape))
    images = []
    t0 = time()
    for _, img_b64 in resp:
        img = image_utils.read_b64(img_b64)
        face = FM.get_face_from_image(img)
        images.append(face.reshape((1,224,224,3)))

    all_faces = np.vstack(images)
    logger.info("Shape of all faces : %s", str(all_faces.shape))
    visitor_vectors = FM.vectorize(all_faces)
    logger.info("Shape of vecs : %s", str(visitor_vectors.shape))
    logger.info(
        "Vectorization done. Time taken {:.3f} seconds".format(time()-t0))

    return [names, visitor_vectors]
