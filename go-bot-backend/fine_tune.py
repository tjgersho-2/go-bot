import openai, os, json, dotenv, time
dotenv.load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Upload
with open("jira_fine_tune.jsonl", "rb") as f:
    file = openai.files.create(file=f, purpose="fine-tune")

# Train
job = openai.fine_tuning.jobs.create(
    training_file=file.id,
    model="gpt-4o-mini-2024-07-18",
    suffix="jira-clarify-v1",
    hyperparameters={"n_epochs": 3}
)

print(f"Training started: {job.id}")
print("Check: https://platform.openai.com/fine-tuning")