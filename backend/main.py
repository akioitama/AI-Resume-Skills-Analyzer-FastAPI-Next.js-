from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import pdfplumber
import docx
import re

app = FastAPI(title="Resume Skills Matcher")

# Helper function to extract text
def extract_text(file: UploadFile):
    text = ""
    if file.filename.endswith(".pdf"):
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() + " "
    elif file.filename.endswith(".docx"):
        doc = docx.Document(file.file)
        for para in doc.paragraphs:
            text += para.text + " "
    else:
        text = file.file.read().decode()
    return text

# Helper function to extract skills from text
def extract_skills(resume_text: str, skills_list: list):
    resume_text = resume_text.lower()
    found_skills = []
    for skill in skills_list:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, resume_text):
            found_skills.append(skill)
    return found_skills

@app.post("/match_skills")
async def match_skills(
    resume: UploadFile,
    required_skills: str = Form(...)
):
    """
    required_skills: comma-separated string, e.g. Python, SQL, Machine Learning
    """
    skills_list = [skill.strip() for skill in required_skills.split(",")]
    
    # Extract resume text
    text = extract_text(resume)
    
    # Find matched skills
    matched = extract_skills(text, skills_list)
    missing = [skill for skill in skills_list if skill not in matched]
    match_percentage = round(len(matched) / len(skills_list) * 100, 2)
    
    return JSONResponse({
        "matched_skills": matched,
        "missing_skills": missing,
        "match_percentage": match_percentage
    })