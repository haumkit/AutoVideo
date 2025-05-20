from datetime import datetime
from mongoengine import Document, StringField, FloatField, DateTimeField, BooleanField, ListField, DictField, ReferenceField

class Video(Document):
    filename = StringField(required=True)
    status = StringField(required=True)
    action = StringField()
    confidence = FloatField()
    upload_time = DateTimeField(default=datetime.utcnow)
    has_feedback = BooleanField(default=False)
    feedback_action = StringField()
    feedback_comment = StringField()
    original_info = DictField()
    normalized_info = DictField()
    error = StringField()
    action_details = DictField()

class Feedback(Document):
    video = ReferenceField(Video, required=True)
    filename = StringField(required=True)
    original_action = StringField(required=True)
    correct_action = StringField(required=True)
    comment = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'feedbacks',
        'indexes': [
            'video',
            'filename',
            'correct_action',
            'created_at'
        ]
    } 