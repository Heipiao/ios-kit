# coding: utf-8
"""
Aliyun OSS 文件存储处理器
"""

import os
import logging
from typing import Optional, Dict, Any

try:
    import oss2
except ImportError:
    oss2 = None

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class AliyunOSSClient:
    """Aliyun OSS 客户端"""

    def __init__(self, access_key_id: str, access_key_secret: str, endpoint: str, bucket_name: str):
        """
        初始化 OSS 客户端

        Args:
            access_key_id: AccessKey ID
            access_key_secret: AccessKey Secret
            endpoint: OSS endpoint (例如：https://oss-cn-hangzhou.aliyuncs.com)
            bucket_name: Bucket 名称
        """
        self.access_key_id = access_key_id
        self.access_key_secret = access_key_secret
        self.endpoint = endpoint
        self.bucket_name = bucket_name

        if oss2 is None:
            raise RuntimeError(
                "缺少 Python 依赖 `oss2`。请在 backend 虚拟环境中运行 `pip install -r requirements.txt`。"
            )

        # 初始化 OSS 客户端
        self.auth = oss2.Auth(access_key_id, access_key_secret)
        self.bucket = oss2.Bucket(self.auth, endpoint, bucket_name, enable_crc=False)

        logger.info(f"AliyunOSSClient 初始化完成 - Bucket: {bucket_name}, Endpoint: {endpoint}")

    def upload_file(self, file_path: str, file_content: bytes, content_type: str = "application/octet-stream") -> str:
        """
        上传文件到 OSS

        Args:
            file_path: OSS 中的文件路径
            file_content: 文件内容 (bytes)
            content_type: 文件 MIME 类型

        Returns:
            上传后的文件路径
        """
        try:
            logger.info(f"开始上传文件到 OSS: {file_path}")

            # 上传文件
            self.bucket.put_object(
                file_path,
                file_content,
                headers={"Content-Type": content_type}
            )

            logger.info(f"文件上传成功：{file_path}")
            return file_path

        except Exception as e:
            logger.error(f"上传文件到 OSS 失败：{e}")
            raise

    def delete_file(self, file_path: str) -> bool:
        """
        删除 OSS 中的文件

        Args:
            file_path: OSS 中的文件路径

        Returns:
            是否删除成功
        """
        try:
            logger.info(f"开始删除 OSS 文件：{file_path}")

            self.bucket.delete_object(file_path)

            logger.info(f"文件删除成功：{file_path}")
            return True

        except Exception as e:
            logger.error(f"删除 OSS 文件失败：{e}")
            return False

    def download_file(self, file_path: str) -> bytes:
        """
        下载 OSS 中的文件内容

        Args:
            file_path: OSS 中的文件路径

        Returns:
            文件内容
        """
        try:
            logger.info(f"开始下载 OSS 文件：{file_path}")
            result = self.bucket.get_object(file_path)
            return result.read()
        except Exception as e:
            logger.error(f"下载 OSS 文件失败：{e}")
            raise

    def get_public_url(self, file_path: str) -> str:
        """
        获取文件的公共访问 URL

        Args:
            file_path: OSS 中的文件路径

        Returns:
            文件的公共访问 URL
        """
        try:
            # 生成 OSS 文件的 HTTP 访问 URL
            endpoint_without_https = self.endpoint.replace('https://', '')
            oss_url = f"https://{self.bucket_name}.{endpoint_without_https}/{file_path}"
            return oss_url

        except Exception as e:
            logger.error(f"生成公共 URL 失败：{e}")
            raise


# 全局 OSS 客户端实例
_oss_client: Optional[AliyunOSSClient] = None


def get_oss_client() -> AliyunOSSClient:
    """
    获取全局 OSS 客户端实例

    Returns:
        AliyunOSSClient 实例
    """
    global _oss_client

    if _oss_client is None:
        # 从环境变量获取配置
        access_key_id = os.getenv("ALIYUN_OSS_ACCESS_KEY_ID")
        access_key_secret = os.getenv("ALIYUN_OSS_ACCESS_KEY_SECRET")
        endpoint = os.getenv("ALIYUN_OSS_ENDPOINT")
        bucket_name = os.getenv("ALIYUN_OSS_BUCKET_NAME", "ios-kit")

        if not all([access_key_id, access_key_secret, endpoint]):
            raise ValueError(
                "缺少 Aliyun OSS 配置，请确保设置了以下环境变量:\n"
                "- ALIYUN_OSS_ACCESS_KEY_ID\n"
                "- ALIYUN_OSS_ACCESS_KEY_SECRET\n"
                "- ALIYUN_OSS_ENDPOINT"
            )

        _oss_client = AliyunOSSClient(
            access_key_id=access_key_id,
            access_key_secret=access_key_secret,
            endpoint=endpoint,
            bucket_name=bucket_name
        )

    return _oss_client
