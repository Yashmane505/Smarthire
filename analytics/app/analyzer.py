import pandas as pd
import numpy as np

def analyze_student_performance(results_data):
    """
    results_data: List of dicts, each containing:
      - test_title: str
      - percentage: float
      - category_breakdown: dict of { category_name: { score: int, total: int } }
    """
    if not results_data or len(results_data) == 0:
        return {
          "average_score": 0.0,
          "tests_taken": 0,
          "placement_readiness_score": 0.0,
          "readiness_status": "Not Evaluated",
          "weak_topics": [],
          "strong_topics": [],
          "recommendations": ["Attempt at least one practice test to generate placement analysis."]
        }

    # Convert results list to Pandas DataFrame
    df = pd.DataFrame(results_data)
    
    # 1. Basic Stats
    tests_taken = len(df)
    average_score = float(df["percentage"].mean())

    # 2. Category Accuracy aggregation
    category_scores = {}
    for res in results_data:
        breakdown = res.get("category_breakdown", {})
        if not breakdown:
            continue
        for cat, scores in breakdown.items():
            if cat not in category_scores:
                category_scores[cat] = {"score": 0, "total": 0}
            category_scores[cat]["score"] += scores.get("score", 0)
            category_scores[cat]["total"] += scores.get("total", 0)

    # Calculate percentages per category
    category_accuracy = {}
    for cat, data in category_scores.items():
        if data["total"] > 0:
            category_accuracy[cat] = float((data["score"] / data["total"]) * 100)

    # Sort categories to find strong and weak topics
    sorted_categories = sorted(category_accuracy.items(), key=lambda x: x[1])
    
    weak_topics = [cat for cat, acc in sorted_categories if acc < 60]
    strong_topics = [cat for cat, acc in sorted_categories if acc >= 75]

    # If no categories are strictly below 60, mark the lowest one as area to improve
    if len(weak_topics) == 0 and len(sorted_categories) > 0:
        weak_topics = [sorted_categories[0][0]]

    # 3. Placement Readiness Calculation (Weighted metric)
    # 80% weight on average accuracy, 20% weight on consistency (taking tests, capped at 5 tests)
    consistency_bonus = min(tests_taken, 5) * 4.0  # Max 20 points
    readiness_score = (average_score * 0.8) + consistency_bonus
    readiness_score = min(float(np.round(readiness_score, 2)), 100.0)

    # Determine status
    if readiness_score >= 80:
        status = "Excellent"
    elif readiness_score >= 60:
        status = "Good"
    elif readiness_score >= 40:
        status = "Average"
    else:
        status = "Needs Improvement"

    # 4. Generate custom recommendations
    recommendations = []
    if tests_taken < 3:
        recommendations.append("Complete at least 3 practice tests to increase profile consistency metrics.")
    
    if len(weak_topics) > 0:
        topics_str = ", ".join(weak_topics)
        recommendations.append(f"Dedicate additional study time to review topics under: {topics_str}.")
        
    if average_score < 70:
        recommendations.append("Focus on review of basic concepts before taking higher-difficulty exams.")
    else:
        recommendations.append("Your performance is solid! Try attempting higher-difficulty coding scenarios.")

    return {
        "average_score": float(np.round(average_score, 2)),
        "tests_taken": tests_taken,
        "placement_readiness_score": readiness_score,
        "readiness_status": status,
        "category_accuracy": category_accuracy,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommendations": recommendations
    }
