from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import admin, articles, astronomical, auth, explanations, health, ratings, users, wordle

app = FastAPI(title="Cosmo Brief API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and {"error", "message"} <= exc.detail.keys():
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": "validation_error", "message": str(exc)},
    )


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(articles.router)
app.include_router(explanations.router)
app.include_router(ratings.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(wordle.router)
app.include_router(astronomical.router)
