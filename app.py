import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from flask import Flask, request, jsonify, session
from transformers import pipeline, BartTokenizer
import re
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
import torch
from flask import Flask, request, jsonify
from flask_caching import Cache
from flask_session import Session
import pickle

app = Flask(__name__)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# Load environment variables from .env file
load_dotenv()

# Access the API keys
google_api_key = os.getenv('GOOGLE_API_KEY')

# Configure Flask-Caching
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

# Load the summarization pipeline with the BART model
model_name = "facebook/bart-large-cnn"
summarizer = pipeline("summarization", model=model_name, device=0 if torch.cuda.is_available() else -1)
tokenizer = BartTokenizer.from_pretrained(model_name)

def clean_text(text):
    # Remove unwanted HTML tags or other non-text content
    text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)  # Remove non-alphanumeric characters
    return text.strip()

# Create a prompt template for user queries
template = """
Question: {question}

Context for answering question: {context}

Instructions: Use the information provided in the context to generate a relevant answer.
"""

prompt_template = PromptTemplate(input_variables=["question", "context"], template=template)

# Initialize the ChatGoogleGenerativeAI instance
chat = ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=google_api_key)

@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    text = data.get('text', '')
    max_length = data.get('max_length', 100)
    print("Max Length = ", max_length)

    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Clean and truncate the input text
    cleaned_text = clean_text(text)
    tokens = tokenizer(cleaned_text, truncation=True, max_length=1024, return_tensors="pt")["input_ids"]

    # Decode the truncated tokens back to text
    truncated_text = tokenizer.decode(tokens[0], skip_special_tokens=True)

    # Summarize the text using the BART model
    summary = summarizer(truncated_text, min_length=max_length, max_length=max_length + 40, do_sample=False)

    return jsonify({"summary": summary[0]['summary_text']})

@app.route('/get_answers', methods=['POST'])
def get_answers():
    data = request.json
    text = data.get('text', '')
    question = data.get('question', '')

    if not question:
        return jsonify({"error": "No question provided"}), 400

    # Check if we need to initialize or update the library
    if 'chunks' not in session or text != session.get('current_text', ''):
        if not text:
            return jsonify({"error": "No text provided for library initialization"}), 400
        
        # Clean and chunk the input text
        cleaned_text = clean_text(text)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=400,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(cleaned_text)

        # Store the chunks and current text in the session
        session['chunks'] = chunks
        session['current_text'] = text
    else:
        # Retrieve the chunks from the session
        chunks = session['chunks']

    # Initialize embeddings with Google Generative AI
    embedding_function = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

    # Create FAISS library (this is not stored in the session)
    library = FAISS.from_texts(chunks, embedding_function)

    # Retrieve relevant chunks based on the question
    retrieved_chunks = library.similarity_search(query=question, k=5)
    context = ""
    for chunk in retrieved_chunks:
        context += chunk.page_content

    prompt = prompt_template.format(question=question, context=context)
    result = chat.invoke(prompt)

    return jsonify({"answer": result.content})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)
