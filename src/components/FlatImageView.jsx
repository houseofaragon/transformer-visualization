
// // Scene
// const START_PADDING = 0;

// function AttentionVisualization({
//   attentionData,
//   image,
//   onImageChange,
// }) {
//   // console.log(attentionData)

//   const groupBy = (items, key) => items.reduce(
//     (result, item) => ({
//       ...result,
//       [item[key]]: [
//         ...(result[item[key]] || []),
//         item
//       ],
//     }),
//     {}
//   )
//   const groups = groupBy(attentionData, 'layer')
//   console.log('groups', groups)

//   return (
//     Object.keys(groups).map((layer) => (
//         <div key={layer} className="grid grid-cols-4 gap-4">
//           <div className="m-5 flex flex-row items-center justify-center">
//             <p className="mr-2">Layer {layer}</p>
//             <svg width="100" height="20" aria-hidden="true">
//               <line 
//                 x1="0" 
//                 y1="10" 
//                 x2="100" 
//                 y2="10" 
//                 stroke="currentColor" 
//                 strokeWidth="1"
//               />
//               <polygon 
//                 points="95,5 100,10 95,15" 
//                 fill="currentColor"
//               />
//             </svg>
//           </div>
//           <div className="m-5 p-3 mr-10 flex flex-row col-span-3" id="image-container">
//             {groups[layer].map((data) => (
//               <div key={data.url}>
//                 <img className="p-1" src={data.image.url} width={data.image.width} height={data.image.height} />
//                 <span>Head {data.head}</span>
//               </div> 
//               )
//             )}
//           </div>
//         </div>
//       )
//     )
//   )
// }

// export default function Apps() {
//   const [result, setResult] = useState(null);
//   const attentionData = useMemo(() => {
//     if (!result) return [];
//     return result.attentions.map(({ layer, head, num_heads, image }) => {
//       const blob = new Blob([image.buffer], { type: 'image/png' });

//       const imageSource = URL.createObjectURL(blob)
//       const imageData = { ...image, url: imageSource}
//       console.log('imageData', imageData)
//       const width = (ATTENTION_HEAD_HEIGHT * image.width) / image.height;
//       const depthOffset = (num_heads - 1) * X_SPACING;
//       const xOffset =
//         width / 2 + depthOffset + layer * (width + depthOffset + LAYER_SPACING);
//       const position = [
//         xOffset - head * X_SPACING,
//         0.5 * ATTENTION_HEAD_HEIGHT - 1,
//         ((num_heads + 1) / 2 - head - 1) * Z_SPACING,
//       ];
//       const label = `Layer ${layer + 1}, Head ${head + 1}`;
//       return { position, label, layer, head, image: imageData};
//     });
//   }, [result]);

//   const label = useMemo(() => result?.label, [result]);
//   const score = useMemo(() => result?.score, [result]);

//   const [state, setState] = useState(null);
//   const [image, setImage] = useState(null);
//   const worker = useRef(null);

//   const handleImageChange = (image) => {
//     setImage(image);
//     worker.current.postMessage({ image });
//   };

//   useEffect(() => {
//     // Initialize worker on mount
//     worker.current ??= new Worker(new URL("./worker.js", import.meta.url), {
//       type: "module",
//     });

//     // NOTE: Certain browsers handle error messages differently, so to ensure
//     // compatibility, we need to handle errors in both `message` and `error` events.
//     const onMessage = ({ data }) => {
//       switch (data.type) {
//         case "status":
//         case "error":
//           setState(data);
//           break;
//         case "output":
//           setResult(data.result);
//           break;
//       }
//     };
//     const onError = (e) => setState({ type: "error", error: e.message });

//     // Attach the callback function as an event listener.
//     worker.current.addEventListener("message", onMessage);
//     worker.current.addEventListener("error", onError);

//     // Define a cleanup function for when the component is unmounted.
//     return () => {
//       worker.current.removeEventListener("message", onMessage);
//       worker.current.removeEventListener("error", onError);
//     };
//   }, []);

//   useEffect(() => {
//     if (
//       state &&
//       state.type === "status" &&
//       state.status === "ready" &&
//       image === null
//     ) {
//       // Run on first load
//       handleImageChange(EXAMPLE_URL);
//     }
//   }, [state, image]);

//   return (
//     <div className="w-screen bg-[#f7f7f7]">
//       {state?.type === "error" ? (
//         <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-1 text-red-600 text-3xl px-8 backdrop-blur-lg bg-black/75 text-center">
//           {state.error}
//         </div>
//       ) : (
//         <>
//           <div className="header">
//             <h1 className="title">Attention Head Visualizer</h1>
//             <p className="subtitle">Interactive visualization of transformer attention patterns</p>
//           </div>
//           <div className="control-group">
//             <label htmlFor="weightUpload" className="upload-button">
//               Upload Image
//               <input
//                 id="weightUpload"
//                 type="file"
//                 accept="image/*"
//                 onChange={() => handleImageChange}
//                 className="sr-only"
//               />
//             </label>
//           </div>
//           <img src={EXAMPLE_URL}/>
//           <p>{label} - {score}</p>
//           <AttentionVisualization
//             attentionData={attentionData}
//             image={image}
//             onImageChange={handleImageChange}
//           />
//         </>
//       )}
//     </div>
//   );
// }
