
{
  "name": "my-bucket-name",
  "location": "US",
  "storageClass": "STANDARD",
  "versioning": {
    "enabled": true
  },
  "iamConfiguration": {
    "uniformBucketLevelAccess": {
      "enabled": true
    }
  },
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": []
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "isLive": false
        }
      }
    ]
  }
}
