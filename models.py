from app import db

class Landmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    unique_number = db.Column(db.String(64), unique=True, nullable=False)
    name_en = db.Column(db.String(256), nullable=False)
    states_name_en = db.Column(db.String(256), nullable=False)
    elo = db.Column(db.Float, default=1400)

    def to_dict(self):
        return {
            'id': self.id,
            'unique_number': self.unique_number,
            'name_en': self.name_en,
            'states_name_en': self.states_name_en,
            'elo': self.elo
        }
