import time
from fastapi import HTTPException, status

FAILED_ATTEMPTS = {}

MAX_ATTEMPTS = 5             
BLOCK_TIME = 10 * 60        


def check_rate_limit(identifier: str):
    current_time = time.time()

    if identifier not in FAILED_ATTEMPTS:
        return

    attempts, first_fail_time = FAILED_ATTEMPTS[identifier]

    if attempts >= MAX_ATTEMPTS:
        if current_time - first_fail_time < BLOCK_TIME:
            remain = int(BLOCK_TIME - (current_time - first_fail_time))
            minutes = remain // 60
            seconds = remain % 60

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Tài khoản bị khóa tạm thời. Vui lòng thử lại sau {minutes} phút {seconds} giây."
            )
        else:
            FAILED_ATTEMPTS.pop(identifier)


def add_failed_attempt(identifier: str):
    current_time = time.time()

    if identifier not in FAILED_ATTEMPTS:
        FAILED_ATTEMPTS[identifier] = [1, current_time]
    else:
        attempts, first_fail = FAILED_ATTEMPTS[identifier]
        FAILED_ATTEMPTS[identifier] = [attempts + 1, first_fail]


def reset_attempts(identifier: str):
    if identifier in FAILED_ATTEMPTS:
        FAILED_ATTEMPTS.pop(identifier)
