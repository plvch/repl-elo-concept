from flask import Blueprint, render_template, jsonify, request
from models import Landmark
from app import db
from utils.elo import update_elo

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/api/landmarks', methods=['GET'])
def get_landmarks():
    landmarks = Landmark.query.order_by(Landmark.elo.desc()).all()
    return jsonify([landmark.to_dict() for landmark in landmarks])

@main_bp.route('/api/compare', methods=['POST'])
def compare_landmarks():
    data = request.json
    winner_id = data['winner_id']
    loser_id = data['loser_id']

    winner = Landmark.query.get(winner_id)
    loser = Landmark.query.get(loser_id)

    if winner and loser:
        winner.elo, loser.elo = update_elo(winner.elo, loser.elo)
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid landmark IDs'})
