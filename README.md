# Attention visualization using Transformers.js

I think it's so cool we can run models right in the browser
thanks to huggingface's [transformer.js](https://github.com/huggingface/transformers.js?tab=readme-ov-file) and [ONNX runtime](https://onnxruntime.ai/)

This app visualizes the attention maps from an image classification model.

## Getting Started
1. Install the necessary dependencies:
    ```bash
    npm install 
    ```

2. Run the project:
    ```bash
    npm run dev 
    ```

3. Build the project: 
    ```bash
    npm run build
    ```

# Worker.js

This is a background worker that is responsible for 
1. Downloading the model
2. Taking an image selected by a user and running it through the `AutoModelForImageClassification` and returning the attention maps.

```javascript
  const model_id = "onnx-community/dinov2-small-with-attentions";
  const model = await AutoModelForImageClassification.from_pretrained(model_id, {
    device: webgpu ? "webgpu" : "wasm",
    dtype: webgpu ? "q4" : "q8",
  })

  // output
  self.postMessage({
    type: "output",
    result: {
    attentions: output,
    label,
    score,
    modelConfig: model.config
    },
  });
```

# Main App
The main app is written in react and uses one of my most favorite libraries ever written [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/examples). I adopted [this](https://codesandbox.io/p/sandbox/dc5fjy) example for my own use case.

# Thanks
Thank you so much to transformers.js and [this example](https://huggingface.co/spaces/webml-community/attention-visualization) from web-ml community that taught me so much.