import hashlib


class DeduplicationService:
    @staticmethod
    def hash_image(image_data: bytes) -> str:
        return hashlib.sha256(image_data).hexdigest()
