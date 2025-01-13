import {
    AutoProcessor,
    AutoModelForImageClassification,
    interpolate_4d,
    RawImage,
    softmax,
    Tensor,
    PreTrainedModel,
    PretrainedConfig
} from '@huggingface/transformers';

interface Navigator {
    gpu?: GPU | undefined;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
export async function supportsWebGPU() {
    try {
        const nav = navigator as Navigator
        if (!nav.gpu) return false
        return !!(await nav.gpu.requestAdaptor())
    } catch (_e) {
        return false;
    }
}

const webGpuSupported = await supportsWebGPU()
const modelId = "onnx-community/dinov2-with-registers-small-with-attentions"
const model =  await AutoModelForImageClassification.from_pretrained(modelId, {
    device: webGpuSupported ? "webgpu" : "wasm",
    dtype: webGpuSupported ? "q4" : "q8"
}).catch((error) => {
    self.postMessage({
        type: "error",
        error: error.toString()
    })
    throw error
}) as PreTrainedModel

/*
    let processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch16');
    let image = await RawImage.read('https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/football-match.jpg');
    let image_inputs = await processor(image);
*/
const processor = await AutoProcessor.from_pretrained(modelId, {}).catch(
    (error) => {
        self.postMessage({
            type: 'error',
            error: error.toString()
        })
        throw error
    }
)

self.postMessage({ type: 'status', status: 'ready '})

const MAX_IMAGE_SIZE = 500

async function resizeImage(image: RawImage) {
    const aspectRatio = image.width / image.height
    let new_width, new_height
    if (image.width > image.height) {
        new_width = MAX_IMAGE_SIZE
        new_height = Math.round(MAX_IMAGE_SIZE * aspectRatio)
    } else {
        new_width = Math.round(MAX_IMAGE_SIZE * aspectRatio) 
        new_height = MAX_IMAGE_SIZE 
    }

    return await image.resize(new_width, new_height)
}

self.onmessage = async (event) => {
    // read in image and resize if needed
    const { image } = event.data
    self.postMessage({ type: 'status', status: "read_image" })

    // https://huggingface.co/docs/transformers.js/v3.0.0/api/utils/image#rawimagereadinput--code--code
    let rawImage = await RawImage.read(image)
    if (image.width > MAX_IMAGE_SIZE || image.height > MAX_IMAGE_SIZE) {
        rawImage = await resizeImage(rawImage)
    }

    // pre-process the image
    // inputs = { pixel_values: Tensor, original_sizes: Array, reshaped_input_sizes: Array }
    const inputs = await processor(rawImage)

    console.log('inputs: ', JSON.stringify(inputs, null, 4))
    self.postMessage({ type: "status", status: "run_model" })

    // run inference
    const { logits, attentions } = await model(inputs)
    self.postMessage({ type: "status", status: "postprocess" });

    // get prediction
    const scores = logits[0]
    const probabilities = softmax(scores.data)
    const predictedClass = scores.argmax().item()

    const score = probabilities[predictedClass] * 100
    const modelConfig = model.config as PretrainedConfig
    const label = modelConfig.id2label[predictedClass]

    // set config values
    const patchSize = modelConfig.patch_size
    const [width, height] = inputs.pixel_values.dims.slice(-2)

    const wFeatMap = Math.floor(width/patchSize)
    const hFeatMap = Math.floor(height/patchSize)
    const numHeads = modelConfig.num_attention_heads
    const numClassTokens = 1
    const numRegisterTokens = modelConfig.num_register_tokens ?? 0

    // visualize attention maps
    const output = []
    for (let i = 0; i < attentions.length; i++) {
        const layer = attentions[i]

        // selected_attentions = [6, 1, 29, 43] 
        const selectedAttentions = layer
            .slice(0,null,[numClassTokens + numRegisterTokens, null])
            .view(numHeads, 1, wFeatMap, hFeatMap)

        // upscaled = [1, 408, 612] 
        const upscaled = await interpolate_4d(
            selectedAttentions, 
            {
                size: [width, height],
                mode: "nearest"
            }
        ) as Tensor

        for (let j = 0; j < numHeads; j++) {
            const headAttentions = upscaled.slice([j])
            const minval = headAttentions.min().item() as number
            const maxval = headAttentions.max().item() as number

            const map = RawImage.fromTensor(
                headAttentions
                    .sub_(minval)
                    .div_(maxval - minval)
                    .mul_(255)
                    .to('uint8')
            ).rgba()

            const image = await createImageBitmap(
                new ImageData(map.data, map.width, map.height),
                { imageOrientation: 'flipY' }
            )

            output.push({
                layer: i,
                head: j,
                numHeads,
                image
            })
        }
    }

    self.postMessage({
        type: 'output',
        result: {
            attentions: output,
            label,
            score,
        }
    })
}