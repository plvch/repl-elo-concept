import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def create_app():
    app = Flask(__name__)
    
    database_url = os.environ.get("DATABASE_URL")
    if database_url is None:
        logger.error("DATABASE_URL environment variable is not set")
        raise ValueError("DATABASE_URL environment variable is not set")
    
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    logger.info(f"Using database URL: {database_url}")
    
    db.init_app(app)

    from models import Landmark
    from routes import main_bp

    app.register_blueprint(main_bp)

    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully")
            if Landmark.query.count() == 0:
                load_landmarks_from_csv()
                logger.info("Landmarks loaded from CSV")
        except Exception as e:
            logger.error(f"Error creating database tables: {str(e)}")
            raise

    return app

def load_landmarks_from_csv():
    from models import Landmark
    import csv

    csv_path = 'items_landmarks.csv'
    try:
        with open(csv_path, 'r') as csvfile:
            csv_reader = csv.DictReader(csvfile)
            count = 0
            for row in csv_reader:
                if count >= 100:
                    break
                landmark = Landmark(
                    unique_number=row['unique_number'],
                    name_en=row['name_en'],
                    states_name_en=row['states_name_en'],
                    elo=1400
                )
                db.session.add(landmark)
                count += 1
        db.session.commit()
        logger.info(f"100 landmarks loaded from {csv_path}")
    except Exception as e:
        logger.error(f"Error loading landmarks from CSV: {str(e)}")
        raise

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000)
