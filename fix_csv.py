import csv

input_file = "jira_scrum_test_cases_smart_farm_assistant.csv"
rows = []
with open(input_file, mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for r in reader:
        r["Issue Type"] = "Story"
        rows.append(r)

with open(input_file, mode="w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Updated all {len(rows)} issues in {input_file} to Issue Type 'Story'.")
