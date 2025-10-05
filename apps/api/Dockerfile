FROM python:3.11

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./ /app

# Run the app. CMD is required to run on Heroku, $PORT is set by Heroku
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
