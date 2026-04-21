#!/usr/bin/env python3
"""
Evaluation script for YouTube Summarizer - Assignment 6
Measures output quality, end-to-end success, and upstream component quality
"""

import json
import requests
import time
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Configuration
LOCAL_API_URL = "http://localhost:3000/api/summarize"
VERCEL_API_URL = "https://youtube-summarizer-roan-five.vercel.app/api/summarize"

def call_api(url, use_vercel=False):
    """Call the summarize API and return response"""
    target = VERCEL_API_URL if use_vercel else LOCAL_API_URL
    
    try:
        start_time = time.time()
        response = requests.post(
            target,
            json={"url": url},
            headers={"Content-Type": "application/json"},
            timeout=45
        )
        latency = time.time() - start_time
        
        if response.status_code == 200:
            return {
                "success": True,
                "data": response.json(),
                "status": response.status_code,
                "latency": latency
            }
        else:
            return {
                "success": False,
                "error": response.json() if response.text else {"error": "Unknown error"},
                "status": response.status_code,
                "latency": latency
            }
    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "error": {"error": "Server not running. Start with: node src/server.js"},
            "status": 0,
            "latency": 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": {"error": str(e)},
            "status": 500,
            "latency": 0
        }

def evaluate_summary_quality(data, expected_topics):
    """Evaluate if summary contains expected topics"""
    if not data or "summary" not in data:
        return 0.0
    
    summary_text = " ".join(data["summary"]).lower()
    
    if not expected_topics:
        return 1.0
    
    found = sum(1 for topic in expected_topics if topic.lower() in summary_text)
    return found / len(expected_topics)

def evaluate_sentiment_accuracy(data, expected_sentiment):
    """Evaluate if sentiment matches expectation"""
    if not data or "sentiment" not in data:
        return 0.0
    
    actual = data["sentiment"].get("label", "").lower()
    expected = expected_sentiment.lower()
    
    return 1.0 if actual == expected else 0.0

def evaluate_upstream_transcript(data):
    """Evaluate transcript/upstream component quality"""
    if not data or "summary" not in data:
        return {
            "has_content": False,
            "total_length": 0,
            "num_points": 0,
            "avg_point_length": 0
        }
    
    total_length = sum(len(point) for point in data["summary"])
    num_points = len(data["summary"])
    avg_length = total_length / num_points if num_points > 0 else 0
    
    return {
        "has_content": total_length > 100,
        "total_length": total_length,
        "num_points": num_points,
        "avg_point_length": avg_length,
        "quality_score": min(1.0, total_length / 200)  # Expect ~150-200 chars
    }

def load_test_cases():
    """Load test cases from JSON file"""
    cases_path = Path(__file__).parent / "cases" / "test_cases.json"
    with open(cases_path, "r") as f:
        return json.load(f)

def run_evaluation(use_vercel=False):
    """Run full evaluation on all test cases"""
    
    test_cases = load_test_cases()
    representative = test_cases["representative_cases"]
    failure_cases = test_cases["failure_cases"]
    
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "target": "VERCEL" if use_vercel else "LOCAL",
        "representative_results": [],
        "failure_results": [],
        "summary": {}
    }
    
    print("=" * 70)
    print(f"📊 EVALUATING YOUTUBE SUMMARIZER")
    print(f"📍 Target: {results['target']}")
    print("=" * 70)
    
    # Test representative cases
    print("\n📹 REPRESENTATIVE CASES (5 total)")
    print("-" * 50)
    
    quality_scores = []
    sentiment_scores = []
    transcript_scores = []
    latencies = []
    success_count = 0
    
    for case in representative:
        print(f"\n  Testing: {case['name']}")
        print(f"  URL: {case['url'][:50]}...")
        
        result = call_api(case["url"], use_vercel)
        
        if result["success"]:
            quality = evaluate_summary_quality(result["data"], case["expected_topics"])
            sentiment_acc = evaluate_sentiment_accuracy(result["data"], case["expected_sentiment"])
            upstream = evaluate_upstream_transcript(result["data"])
            
            quality_scores.append(quality)
            sentiment_scores.append(sentiment_acc)
            transcript_scores.append(upstream["quality_score"])
            latencies.append(result["latency"])
            success_count += 1
            
            results["representative_results"].append({
                "id": case["id"],
                "name": case["name"],
                "success": True,
                "quality_score": quality,
                "sentiment_accuracy": sentiment_acc,
                "transcript_quality": upstream["quality_score"],
                "latency": result["latency"],
                "num_summary_points": upstream["num_points"],
                "summary_preview": result["data"]["summary"][:2] if result["data"]["summary"] else []
            })
            
            print(f"  ✅ SUCCESS")
            print(f"     Quality: {quality:.0%} | Sentiment: {sentiment_acc:.0%} | Upstream: {upstream['quality_score']:.0%}")
            print(f"     Latency: {result['latency']:.1f}s | Points: {upstream['num_points']}")
        else:
            results["representative_results"].append({
                "id": case["id"],
                "name": case["name"],
                "success": False,
                "error": result["error"],
                "latency": result["latency"]
            })
            print(f"  ❌ FAILED: {result['error'].get('error', 'Unknown error')}")
    
    # Test failure cases
    print("\n\n🔴 FAILURE CASES (2 total)")
    print("-" * 50)
    
    failure_handled = 0
    
    for case in failure_cases:
        print(f"\n  Testing: {case['name']}")
        print(f"  URL: {case['url']}")
        
        result = call_api(case["url"], use_vercel)
        
        # Failure case should NOT succeed (status should not be 200)
        is_proper_failure = not result["success"] or result["status"] != 200
        
        if is_proper_failure:
            failure_handled += 1
            print(f"  ✅ PROPERLY REJECTED")
            print(f"     Status: {result['status']}")
            print(f"     Error: {result['error'].get('error', result['error'])}")
        else:
            print(f"  ❌ SHOULD HAVE FAILED but returned {result['status']}")
        
        results["failure_results"].append({
            "id": case["id"],
            "name": case["name"],
            "properly_handled": is_proper_failure,
            "status": result["status"],
            "error": result["error"] if not result["success"] else None
        })
    
    # Calculate summary statistics
    if quality_scores:
        results["summary"] = {
            "end_to_end_success_rate": success_count / len(representative),
            "avg_quality_score": sum(quality_scores) / len(quality_scores),
            "avg_sentiment_accuracy": sum(sentiment_scores) / len(sentiment_scores),
            "avg_transcript_quality": sum(transcript_scores) / len(transcript_scores),
            "avg_latency_seconds": sum(latencies) / len(latencies),
            "failure_handling_rate": failure_handled / len(failure_cases),
            "total_tests": len(representative) + len(failure_cases)
        }
    
    return results

def save_results(results, filename=None):
    """Save evaluation results to JSON file"""
    if filename is None:
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"evaluation_results_{timestamp}.json"
    
    results_path = Path(__file__).parent / "results" / filename
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📁 Results saved to: {results_path}")
    return results_path

def print_summary(results):
    """Print a clean summary of results"""
    print("\n" + "=" * 70)
    print("📊 EVALUATION SUMMARY")
    print("=" * 70)
    
    s = results["summary"]
    
    print(f"\n  📈 End-to-end success rate:    {s.get('end_to_end_success_rate', 0):.0%}")
    print(f"  🎯 Summary quality score:       {s.get('avg_quality_score', 0):.0%}")
    print(f"  😊 Sentiment accuracy:          {s.get('avg_sentiment_accuracy', 0):.0%}")
    print(f"  📝 Transcript/upstream quality: {s.get('avg_transcript_quality', 0):.0%}")
    print(f"  ⏱️  Average latency:              {s.get('avg_latency_seconds', 0):.1f} seconds")
    print(f"  🛡️  Failure case handling:        {s.get('failure_handling_rate', 0):.0%}")
    print(f"  📊 Total tests run:             {s.get('total_tests', 0)}")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Evaluate YouTube Summarizer")
    parser.add_argument("--vercel", action="store_true", help="Test against Vercel deployment")
    parser.add_argument("--local", action="store_true", default=True, help="Test against local server")
    args = parser.parse_args()
    
    use_vercel = args.vercel
    
    if not use_vercel:
        print("\n⚠️  Make sure your local server is running: node src/server.js")
        input("Press Enter to continue...")
    
    results = run_evaluation(use_vercel=use_vercel)
    save_results(results)
    print_summary(results)