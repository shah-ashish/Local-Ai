import threading

class RequestTracker:
    def __init__(self):
        self._active_requests: dict[str, threading.Event] = {}
        self._lock = threading.Lock()

    def register(self, request_id: str) -> threading.Event:
        with self._lock:
            event = threading.Event()
            self._active_requests[request_id] = event
            return event

    def is_cancelled(self, request_id: str) -> bool:
        with self._lock:
            event = self._active_requests.get(request_id)
            return event.is_set() if event else False

    def cancel(self, request_id: str) -> bool:
        with self._lock:
            event = self._active_requests.get(request_id)
            if event:
                event.set()
                self._active_requests.pop(request_id, None)
                return True
            return False

    def release(self, request_id: str) -> None:
        with self._lock:
            self._active_requests.pop(request_id, None)

request_tracker = RequestTracker()
