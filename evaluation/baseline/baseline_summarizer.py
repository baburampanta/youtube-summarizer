#!/usr/bin/env python3
"""
Lightweight Baseline: Simple keyword-based extractive summarizer
No LLM - just extracts frequent sentences
Used for comparison against LLM-powered system
"""

import re
import json
from collections import Counter
from pathlib import Path

# Common stopwords to ignore
STOPWORDS = {
    'the', 'a', 'an', 'and', 'of', 'to', 'is', 'in', 'that', 'it',
    'for', 'on', 'with', 'as', 'by', 'at', 'from', 'be', 'this', 'are',
    'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing', 'but', 'or', 'so', 'for', 'nor',
    'so', 'yet', 'just', 'like', 'can', 'will', 'would', 'could', 'should'
}

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    patterns = [
        r'youtube\.com/watch\?v=([\w-]+)',
        r'youtu\.be/([\w-]+)',
        r'youtube\.com/embed/([\w-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def clean_text(text):
    """Clean text by removing extra whitespace and special characters"""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s\.]', '', text)
    return text.strip()

def sentence_tokenize(text):
    """Split text into sentences"""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
    return sentences

def get_word_frequencies(sentences):
    """Calculate word frequencies across all sentences"""
    all_words = []
    
    for sentence in sentences:
        words = re.findall(r'\b[a-z]{3,}\b', sentence.lower())
        all_words.extend([w for w in words if w not in STOPWORDS])
    
    return Counter(all_words)

def score_sentences(sentences, word_freq):
    """Score sentences based on word frequency"""
    scored = []
    
    for sentence in sentences:
        words = re.findall(r'\b[a-z]{3,}\b', sentence.lower())
        score = sum(word_freq.get(w, 0) for w in words if w not in STOPWORDS)
        # Normalize by sentence length
        score = score / max(len(words), 1)
        scored.append((score, sentence))
    
    return scored

def extract_top_sentences(scored_sentences, num_points=5):
    """Extract top N sentences"""
    scored_sentences.sort(reverse=True)
    top_sentences = [s for _, s in scored_sentences[:num_points]]
    return top_sentences

def simple_sentiment_analysis(text):
    """Simple sentiment based on positive/negative word counts"""
    positive_words = {
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'best',
        'love', 'positive', 'awesome', 'fantastic', 'helpful', 'useful',
        'valuable', 'important', 'interesting', 'enjoy', 'like', 'recommend'
    }
    
    negative_words = {
        'bad', 'terrible', 'awful', 'worst', 'hate', 'negative', 'poor',
        'disappointing', 'waste', 'useless', 'boring', 'confusing',
        'difficult', 'problem', 'issue', 'error', 'fail'
    }
    
    words = text.lower().split()
    pos_count = sum(1 for w in words if w in positive_words)
    neg_count = sum(1 for w in words if w in negative_words)
    
    if pos_count > neg_count:
        return "Positive", 0.6 + (min(pos_count, 10) / 50)
    elif neg_count > pos_count:
        return "Negative", 0.6 + (min(neg_count, 10) / 50)
    else:
        return "Neutral", 0.5

def baseline_summarize(url, transcript=None):
    """
    Baseline summarizer without LLM
    
    Args:
        url: YouTube URL (for video ID)
        transcript: Optional transcript text. If None, uses mock.
    
    Returns:
        dict with summary, sentiment, takeaways
    """
    
    video_id = extract_video_id(url)
    
    if not video_id:
        return {
            "error": "Could not extract video ID",
            "summary": ["Invalid URL"],
            "sentiment": {"label": "Error", "confidence": 0},
            "takeaways": []
        }
    
    # Use provided transcript or mock for testing
    if transcript:
        raw_text = transcript
    else:
        # Mock transcript for baseline testing
        raw_text = f"""
        This video (ID: {video_id}) discusses important topics about technology and innovation.
        The presenter explains key concepts in an easy-to-understand way.
        Several practical examples are provided throughout the presentation.
        The main takeaways include understanding the core principles.
        Applying these concepts to real-world situations is emphasized.
        Measuring results and iterating on feedback is crucial.
        The conclusion reinforces the importance of continuous learning.
        Viewers are encouraged to practice the demonstrated techniques.
        Additional resources are mentioned for deeper exploration.
        """
    
    # Clean and tokenize
    cleaned = clean_text(raw_text)
    sentences = sentence_tokenize(cleaned)
    
    if not sentences:
        return {
            "error": "No content to summarize",
            "summary": ["No content available"],
            "sentiment": {"label": "Neutral", "confidence": 0.5},
            "takeaways": []
        }
    
    # Extract summary
    word_freq = get_word_frequencies(sentences)
    scored_sentences = score_sentences(sentences, word_freq)
    summary = extract_top_sentences(scored_sentences, num_points=5)
    
    # Sentiment analysis
    sentiment_label, sentiment_conf = simple_sentiment_analysis(cleaned)
    
    # Takeaways (use first 3 summary points)
    takeaways = summary[:3] if len(summary) >= 3 else summary + ["Review the content for more insights"]
    
    return {
        "summary": summary,
        "sentiment": {
            "label": sentiment_label,
            "confidence": sentiment_conf,
            "explanation": f"Based on keyword analysis using {len(set(cleaned.lower().split()))} unique words"
        },
        "takeaways": takeaways,
        "method": "keyword_extraction",
        "video_id": video_id
    }

def compare_with_llm(llm_result, baseline_result):
    """Compare LLM and baseline results side by side"""
    comparison = {
        "llm_summary_length": sum(len(p) for p in llm_result.get("summary", [])),
        "baseline_summary_length": sum(len(p) for p in baseline_result.get("summary", [])),
        "llm_sentiment": llm_result.get("sentiment", {}).get("label", "Unknown"),
        "baseline_sentiment": baseline_result.get("sentiment", {}).get("label", "Unknown"),
        "llm_num_points": len(llm_result.get("summary", [])),
        "baseline_num_points": len(baseline_result.get("summary", [])),
    }
    
    return comparison

if __name__ == "__main__":
    # Test baseline on sample URLs
    test_urls = [
        "https://www.youtube.com/watch?v=8jPQjjsBbIc",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    ]
    
    print("=" * 60)
    print("BASELINE SUMMARIZER (No LLM - Keyword Extraction)")
    print("=" * 60)
    
    for url in test_urls:
        result = baseline_summarize(url)
        
        print(f"\n📹 URL: {url[:50]}...")
        print(f"   Video ID: {result.get('video_id', 'Unknown')}")
        print(f"   Method: {result.get('method', 'unknown')}")
        print(f"   Summary ({len(result['summary'])} points):")
        for i, point in enumerate(result['summary'][:3], 1):
            print(f"      {i}. {point[:80]}...")
        print(f"   Sentiment: {result['sentiment']['label']} (confidence: {result['sentiment']['confidence']:.0%})")
        print(f"   Takeaways: {len(result['takeaways'])} points")