import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Enable hot reload in development mode
        log_level="debug",
        access_log=True,
    )
