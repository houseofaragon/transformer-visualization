import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { geometry } from 'maath'
import { groupBy } from './utils/utils'

import { Scene } from './components/Scene'

extend(geometry)

// Input image
const EXAMPLE_URL = '/assets/hummingbird.png';

// Attention heads
const ATTENTION_HEAD_HEIGHT = 2.4;
const X_SPACING = 0.4;
const Z_SPACING = 2;
const LAYER_SPACING = 0.25;

export default function App() {
  const [result, setResult] = useState(null);
  const [workerState, setWorkerState] = useState(null);
  const [image, setImage] = useState(null);
  const worker = useRef(null);

  const attentionData = useMemo(() => {
    if (!result) return [];
    return result.attentions.map(({ layer, head, num_heads, image }) => {
      const blob = new Blob([image.buffer], { type: 'image/png' });

      const imageSource = URL.createObjectURL(blob)
      const imageData = { ...image, url: imageSource}
      // console.log('imageData', imageData)
      const width = (ATTENTION_HEAD_HEIGHT * image.width) / image.height;
      const depthOffset = (num_heads - 1) * X_SPACING;
      const xOffset =
        width / 2 + depthOffset + layer * (width + depthOffset + LAYER_SPACING);
      const position = [
        xOffset - head * X_SPACING,
        0.5 * ATTENTION_HEAD_HEIGHT - 1,
        ((num_heads + 1) / 2 - head - 1) * Z_SPACING,
      ];
      const label = `Layer ${layer + 1}, Head ${head + 1}`;
      return { position, label, layer, head, image: imageData};
    });
  }, [result]);

  const label = useMemo(() => result?.label, [result]);
  const score = useMemo(() => result?.score, [result]);
  const modelConfig = useMemo(() => result?.modelConfig, [result])

  const handleImageChange = (image) => {
    console.log('image', image)
    let data = image
    if (typeof image === 'object') {
      const file = data.target.files[0]
      data = URL.createObjectURL(file)
    }
    setImage(data);
    worker.current.postMessage({ image: data });
  };

  useEffect(() => {
    // Initialize worker on mount
    worker.current ??= new Worker(new URL("./worker.js", import.meta.url), {
      type: "module",
    });

    // NOTE: Certain browsers handle error messages differently, so to ensure
    // compatibility, we need to handle errors in both `message` and `error` events.
    const onMessage = ({ data }) => {
      switch (data.type) {
        case "status":
        case "error":
          setWorkerState(data);
          break;
        case "output":
          setResult(data.result);
          break;
      }
    };

    const onError = (e) => setWorkerState({ type: "error", error: e.message });

    // Attach the callback function as an event listener.
    worker.current.addEventListener("message", onMessage);
    worker.current.addEventListener("error", onError);

    // Define a cleanup function for when the component is unmounted.
    return () => {
      worker.current.removeEventListener("message", onMessage);
      worker.current.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (
      workerState &&
      workerState.type === "status" &&
      workerState.status === "ready" &&
      image === null
    ) {
      // Run on first load
      handleImageChange(EXAMPLE_URL);
    }
  }, [workerState, image]);


  if (!result || !attentionData.length) {
    return <div>Loading</div>
  }

  const groups = groupBy(attentionData, 'layer')

  return (
    <>
      <div style={{ position: 'absolute', bottom: 40, left: 40, fontSize: '13px' }}>
      <p>Hover over an image. Scroll up/down to navigate</p>
      </div>

      <div className='absolute p-20 w-full h-full pointer-events-none z-1'>
        <input className="z-100" type="file" id="fileInput" hidden onChange={handleImageChange} />
        <label htmlFor="fileInput" className="custom-file-upload z-100">Choose a file</label>

        <div className='image-container'>
          {image && <img className='w-50 h-auto' src={image ? image : EXAMPLE_URL} />}
        </div>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 60, overflowWrap: 'break-word'  }}>
          <div>
              <h4>{modelConfig.architectures[0]}</h4>
              <h4>Model Prediction</h4>
              <h2>{label} {score}%</h2>
              <br />
              <ul>
                <li></li>
                <li>No. attention heads: {modelConfig.num_attention_heads}</li>
                <li>No. hidden layers: {modelConfig.num_attention_heads}</li>
                <li>No. register tokens: {modelConfig.num_registered_tokens}</li>
              </ul>
          </div>
        </div>
      <Canvas dpr={window.devicePixelRatio}>
        <ScrollControls pages={12} infinite>
          <Scene position={[0, 1, 0]} data={groups} />
        </ScrollControls>
      </Canvas>
    </>
  )
}








