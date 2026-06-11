import time
import threading
import os

# Custom Snowflake-like ID Generator
class SnowflakeGenerator:
    def __init__(self, worker_id: int, epoch: int = 1704067200000): # Default Epoch: 2024-01-01
        self.worker_id = worker_id & 0x3FF  # 10 bits for worker id (0-1023)
        self.epoch = epoch
        self.sequence = 0
        self.last_timestamp = -1
        self.lock = threading.Lock()

    def _get_timestamp(self):
        return int(time.time() * 1000)

    def generate_id(self) -> int:
        with self.lock:
            timestamp = self._get_timestamp()

            if timestamp < self.last_timestamp:
                raise Exception("Clock moved backwards!")

            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & 0xFFF  # 12 bits (0-4095)
                if self.sequence == 0:
                    # Sequence overflow, wait for next millisecond
                    while timestamp <= self.last_timestamp:
                        timestamp = self._get_timestamp()
            else:
                self.sequence = 0

            self.last_timestamp = timestamp

            # Shift bits to form 64-bit ID
            # 41 bits timestamp | 10 bits worker_id | 12 bits sequence
            new_id = ((timestamp - self.epoch) << 22) | (self.worker_id << 12) | self.sequence
            return new_id

# Base62 Encoding
BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

def encode_base62(num: int) -> str:
    if num == 0:
        return BASE62_ALPHABET[0]
    
    arr = []
    base = len(BASE62_ALPHABET)
    while num:
        num, rem = divmod(num, base)
        arr.append(BASE62_ALPHABET[rem])
    
    arr.reverse()
    return ''.join(arr)

# Singleton instance
WORKER_ID = int(os.getenv("WORKER_ID", 0))
generator = SnowflakeGenerator(worker_id=WORKER_ID)

def generate_distributed_key() -> str:
    snowflake_id = generator.generate_id()
    return encode_base62(snowflake_id)
