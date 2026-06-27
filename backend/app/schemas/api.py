from pydantic import BaseModel, Field


class CreateClassroomRequest(BaseModel):
    title: str = "Clase en vivo"
    teacher_name: str | None = Field(alias="teacherName", default=None)

    model_config = {"populate_by_name": True}


class JoinRequest(BaseModel):
    user_id: str = Field(alias="userId")
    role: str = "student"
    display_name: str | None = Field(alias="displayName", default=None)

    model_config = {"populate_by_name": True}


class StateResponse(BaseModel):
    classroom_id: str = Field(alias="classroomId")
    participants: list[dict]
    latest_transcript: str | None = Field(alias="latestTranscript", default=None)
    latest_screen_explanation: str | None = Field(alias="latestScreenExplanation", default=None)
    latest_screen_full_text: str | None = Field(alias="latestScreenFullText", default=None)

    model_config = {"populate_by_name": True}
