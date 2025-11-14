import os, json, dotenv, openai
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
dotenv.load_dotenv()

# Init
openai.api_key = os.getenv("OPENAI_API_KEY")
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("jira-vectors")

# Embed model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Load 50 tickets
with open("jira_clarify_50.jsonl") as f:
    tickets = [json.loads(line) for line in f]

vectors = []
for i, t in enumerate(tickets):
    text = f"{t["raw_title"]} {t["raw_description"]}"
    emb = model.encode(text).tolist()
    vectors.append({
        "id": f"ticket-{i}",
        "values": emb,
        "metadata": {"title": t["raw_title"], "desc": t["raw_description"]}
    })

# Upsert
index.upsert(vectors=vectors)
print(f"Uploaded {len(vectors)} vectors to Pinecone")

