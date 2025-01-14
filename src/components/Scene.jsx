import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { easing } from 'maath'

import { Cards } from './Cards'
import { ActiveCard } from './ActiveCard'

export function Scene({ data, props }) {
    const ref = useRef()
    const scroll = useScroll()
    const [hovered, hover] = useState(null)
  
    useFrame((state, delta) => {
      ref.current.rotation.y = -scroll.offset * (Math.PI * 2) // Rotate contents
      state.events.update() // Raycasts every frame rather than on pointer-move
      easing.damp3(
        state.camera.position, 
        [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9],
        0.3,
        delta
      )
      state.camera.lookAt(0, -2, 0)
    })
   
    return (
      <group ref={ref} {...props}>
        {Object.keys(data).map((layer, i) => (
          <Cards
            data={data[layer]}
            key={i}
            category={`Layer ${i + 1}`}
            from={(Math.PI / 6) * i} // Starting angle of the category
            len={Math.PI / 6} // Length of each segment
            position={[
              0, 
              Math.sin((Math.PI / 6) * i) * 0.4, 
              Math.cos((Math.PI / 6) * i) * 0.4
            ]} 
            onPointerOver={hover}
            onPointerOut={hover}
          />
        ))}
        <ActiveCard hovered={hovered} defaultHover={data[0][0]} />
      </group>
    )
  }