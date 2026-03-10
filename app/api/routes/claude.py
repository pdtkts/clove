import time

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse, JSONResponse
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_fixed,
)

from app.core.config import settings
from app.core.exceptions import NoResponseError
from app.dependencies.auth import AuthDep
from app.models.claude import MessagesAPIRequest
from app.processors.claude_ai import ClaudeAIContext
from app.processors.claude_ai.pipeline import ClaudeAIPipeline
from app.utils.retry import is_retryable_error, log_before_sleep

router = APIRouter()

# Fixed timestamp for /v1/models response (set once at module load)
_MODELS_CREATED_TS = int(time.time())


@router.get("/models")
async def list_models():
    """Return available models in OpenAI-compatible format.

    No auth required - consistent with OpenAI API convention where
    /models is publicly accessible. Many clients call this before auth.
    """
    models = [
        {
            "id": model_id,
            "object": "model",
            "created": _MODELS_CREATED_TS,
            "owned_by": "anthropic",
        }
        for model_id in settings.available_models
    ]
    return {"object": "list", "data": models}


@router.post("/messages", response_model=None)
@retry(
    retry=retry_if_exception(is_retryable_error),
    stop=stop_after_attempt(settings.retry_attempts),
    wait=wait_fixed(settings.retry_interval),
    before_sleep=log_before_sleep,
    reraise=True,
)
async def create_message(
    request: Request, messages_request: MessagesAPIRequest, _: AuthDep
) -> StreamingResponse | JSONResponse:
    context = ClaudeAIContext(
        original_request=request,
        messages_api_request=messages_request,
    )

    context = await ClaudeAIPipeline().process(context)

    if not context.response:
        raise NoResponseError()

    return context.response
