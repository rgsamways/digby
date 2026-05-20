import random

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.models.quiz_result import QuizResult
from app.models.user import User

router = APIRouter()

POINTS_PER_CORRECT = 5
PERFECT_BONUS = 25
QUESTIONS_PER_SESSION = 10

_BANK = [
    {
        "id": "q01",
        "question": "What is Ontario's official provincial mineral?",
        "options": ["Amethyst", "Gold", "Calcite", "Feldspar"],
        "answer": "Amethyst",
        "explanation": "Amethyst was designated Ontario's official mineral in 2012. The Thunder Bay area hosts some of the world's largest deposits.",
    },
    {
        "id": "q02",
        "question": "Bancroft, Ontario is nicknamed what?",
        "options": ["Mineral Capital of Canada", "Gem City of the North", "Crystal Town", "The Rock Hub"],
        "answer": "Mineral Capital of Canada",
        "explanation": "Bancroft sits at the heart of Ontario's mineral-rich Grenville geological province and hosts hundreds of mineral species.",
    },
    {
        "id": "q03",
        "question": "Which simple test distinguishes calcite from quartz?",
        "options": ["Calcite fizzes with dilute acid", "Calcite floats in water", "Calcite is always white", "Calcite scratches glass"],
        "answer": "Calcite fizzes with dilute acid",
        "explanation": "Calcite (CaCO₃) reacts with dilute hydrochloric acid producing CO₂ bubbles. Quartz (SiO₂) does not react.",
    },
    {
        "id": "q04",
        "question": "What is the Mohs hardness of quartz?",
        "options": ["7", "5", "9", "3"],
        "answer": "7",
        "explanation": "Quartz scores 7 on the Mohs scale — hard enough to scratch glass (5.5) but softer than topaz (8) and corundum (9).",
    },
    {
        "id": "q05",
        "question": "Which mineral is nicknamed 'Fool's Gold'?",
        "options": ["Pyrite", "Chalcopyrite", "Mica", "Galena"],
        "answer": "Pyrite",
        "explanation": "Pyrite (FeS₂) has a brassy metallic luster that fools beginners. Real gold is much softer, heavier, and doesn't tarnish.",
    },
    {
        "id": "q06",
        "question": "Galena is the primary ore mineral of which metal?",
        "options": ["Lead", "Zinc", "Copper", "Silver"],
        "answer": "Lead",
        "explanation": "Galena (PbS) is the most important lead ore and is often found alongside silver, which it can contain in small amounts.",
    },
    {
        "id": "q07",
        "question": "The spectacular colour-play seen in labradorite is called:",
        "options": ["Labradorescence", "Fluorescence", "Chatoyancy", "Asterism"],
        "answer": "Labradorescence",
        "explanation": "Labradorescence is caused by light scattering between thin layers within the feldspar structure, producing blues, greens, and golds.",
    },
    {
        "id": "q08",
        "question": "What causes the vibrant green colour of malachite?",
        "options": ["Copper", "Iron", "Chromium", "Nickel"],
        "answer": "Copper",
        "explanation": "Malachite is a copper carbonate hydroxide mineral [Cu₂CO₃(OH)₂]. The copper content gives it its distinctive banded green colour.",
    },
    {
        "id": "q09",
        "question": "Fluorite is famous for which property under UV light?",
        "options": ["Fluorescence", "Phosphorescence", "Birefringence", "Triboluminescence"],
        "answer": "Fluorescence",
        "explanation": "The phenomenon of fluorescence is actually named after fluorite, one of the earliest and most striking examples discovered.",
    },
    {
        "id": "q10",
        "question": "What type of rock is granite?",
        "options": ["Igneous", "Sedimentary", "Metamorphic", "Volcanic glass"],
        "answer": "Igneous",
        "explanation": "Granite is an intrusive igneous rock that cools slowly deep underground, allowing large interlocking crystals of quartz, feldspar, and mica to form.",
    },
    {
        "id": "q11",
        "question": "The Precambrian Shield underlying much of Ontario is approximately how old?",
        "options": ["1–4 billion years", "100 million years", "500 million years", "250,000 years"],
        "answer": "1–4 billion years",
        "explanation": "The Canadian Shield is among Earth's oldest exposed rock, ranging from roughly 1 to over 4 billion years old — ancient even by geological standards.",
    },
    {
        "id": "q12",
        "question": "What does a mineral's 'streak' test reveal?",
        "options": ["The colour of its powder", "Its hardness", "Its luster", "Its crystal structure"],
        "answer": "The colour of its powder",
        "explanation": "Streak is the colour of a mineral's powder when scraped across unglazed porcelain. It's often more diagnostic than surface colour — pyrite's streak is black, not gold.",
    },
    {
        "id": "q13",
        "question": "The Bancroft-Madawaska area of Ontario is famous for deposits of which radioactive mineral?",
        "options": ["Uraninite", "Thorite", "Monazite", "Autunite"],
        "answer": "Uraninite",
        "explanation": "Uraninite (UO₂), also called pitchblende, was mined extensively near Bancroft. Ontario was a major uranium producer in the mid-20th century.",
    },
    {
        "id": "q14",
        "question": "Sodalite, a vivid blue mineral, is found in large quantities near which Ontario region?",
        "options": ["Bancroft / Haliburton", "Thunder Bay", "Sudbury", "Niagara"],
        "answer": "Bancroft / Haliburton",
        "explanation": "The Bancroft and Haliburton Highlands area contains nepheline syenite intrusions rich in sodalite, making it a world-class source of gem-quality material.",
    },
    {
        "id": "q15",
        "question": "The 'cat's eye' optical effect in minerals (chatoyancy) is caused by:",
        "options": ["Parallel fibrous inclusions", "Air bubbles", "Water trapped inside", "High iron content"],
        "answer": "Parallel fibrous inclusions",
        "explanation": "Chatoyancy occurs when light reflects off densely packed parallel fibres or channels within the mineral, concentrating into a single luminous band.",
    },
    {
        "id": "q16",
        "question": "Which of these is NOT a carbonate mineral?",
        "options": ["Pyrite", "Calcite", "Dolomite", "Malachite"],
        "answer": "Pyrite",
        "explanation": "Pyrite is an iron sulfide (FeS₂). Calcite, dolomite, and malachite all contain the carbonate ion (CO₃²⁻).",
    },
    {
        "id": "q17",
        "question": "Magnetite is set apart from most minerals by being:",
        "options": ["Naturally magnetic", "Radioactive", "Strongly fluorescent", "The hardest oxide"],
        "answer": "Naturally magnetic",
        "explanation": "Magnetite (Fe₃O₄) is one of the few naturally magnetic minerals. It was historically used to make the first magnetic compasses.",
    },
    {
        "id": "q18",
        "question": "What is the main mineral component of limestone?",
        "options": ["Calcite", "Quartz", "Feldspar", "Halite"],
        "answer": "Calcite",
        "explanation": "Limestone is a sedimentary rock composed primarily of calcite (CaCO₃), often from the compressed remains of ancient marine organisms.",
    },
    {
        "id": "q19",
        "question": "Amethyst is actually a purple variety of which common mineral?",
        "options": ["Quartz", "Feldspar", "Calcite", "Fluorite"],
        "answer": "Quartz",
        "explanation": "Amethyst is quartz (SiO₂) coloured purple by iron impurities and natural irradiation. Its hardness of 7 makes it durable for jewellery.",
    },
    {
        "id": "q20",
        "question": "Which mineral has the highest hardness (10) on the Mohs scale?",
        "options": ["Diamond", "Corundum", "Topaz", "Spinel"],
        "answer": "Diamond",
        "explanation": "Diamond is pure carbon in a cubic crystal structure and is the hardest natural substance known. Corundum (ruby/sapphire) scores 9.",
    },
    {
        "id": "q21",
        "question": "The Sudbury Basin in Ontario formed from:",
        "options": ["A massive meteorite impact", "Ancient volcanic activity", "Glacial erosion", "Tectonic collision"],
        "answer": "A massive meteorite impact",
        "explanation": "The Sudbury Basin is a 1.85-billion-year-old impact structure. The impact melted rock and concentrated nickel, copper, and platinum-group minerals into the world-class deposits mined today.",
    },
    {
        "id": "q22",
        "question": "Feldspar belongs to which major mineral group?",
        "options": ["Silicates", "Carbonates", "Oxides", "Sulfides"],
        "answer": "Silicates",
        "explanation": "Feldspars are tectosilicates — the most abundant mineral group in Earth's crust, making up about 60% of all crustal rock.",
    },
    {
        "id": "q23",
        "question": "What property describes how a mineral breaks along smooth flat planes?",
        "options": ["Cleavage", "Fracture", "Parting", "Exfoliation"],
        "answer": "Cleavage",
        "explanation": "Cleavage reflects the internal crystal structure. Mica cleaves perfectly in one direction into thin sheets; halite cleaves in three directions into cubes.",
    },
    {
        "id": "q24",
        "question": "Which crystal system has three equal axes at 90° to each other?",
        "options": ["Cubic (Isometric)", "Tetragonal", "Hexagonal", "Orthorhombic"],
        "answer": "Cubic (Isometric)",
        "explanation": "The cubic system (a=b=c, all 90°) produces highly symmetrical forms like cubes and octahedra. Halite, galena, and pyrite all crystallise in this system.",
    },
    {
        "id": "q25",
        "question": "Rockhounding on private land in Ontario legally requires:",
        "options": ["Permission from the landowner", "A provincial collecting permit", "Membership in a mineral club", "Nothing — surface collecting is always free"],
        "answer": "Permission from the landowner",
        "explanation": "In Ontario, mineral rights on private land belong to the landowner (unless severed). Always get written permission before collecting — which is exactly what Digby is here for!",
    },
]


class SubmitBody(BaseModel):
    answers: dict[str, str]


@router.get("/questions")
async def get_questions(visitor: User = Depends(get_current_user)) -> list[dict]:
    selected = random.sample(_BANK, QUESTIONS_PER_SESSION)
    return [
        {"id": q["id"], "question": q["question"], "options": q["options"], "answer": q["answer"], "explanation": q["explanation"]}
        for q in selected
    ]


@router.post("/submit")
async def submit_quiz(
    body: SubmitBody,
    visitor: User = Depends(get_current_user),
) -> dict:
    bank_map = {q["id"]: q for q in _BANK}
    results = []
    correct_count = 0

    for qid, chosen in body.answers.items():
        q = bank_map.get(qid)
        if not q:
            continue
        is_correct = chosen == q["answer"]
        if is_correct:
            correct_count += 1
        results.append({
            "id": qid,
            "correct": is_correct,
            "correct_answer": q["answer"],
            "explanation": q["explanation"],
        })

    score = correct_count
    perfect = score == QUESTIONS_PER_SESSION
    points = score * POINTS_PER_CORRECT + (PERFECT_BONUS if perfect else 0)

    result = QuizResult(
        visitor_id=visitor.id,
        score=score,
        max_score=QUESTIONS_PER_SESSION,
        points_awarded=points,
    )
    await result.insert()

    return {
        "score": score,
        "max_score": QUESTIONS_PER_SESSION,
        "points_awarded": points,
        "perfect": perfect,
        "results": results,
    }
