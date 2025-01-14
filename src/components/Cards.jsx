import { Billboard, Text } from '@react-three/drei'
import { Card } from './Card'
import { suspend } from 'suspend-react'
import { useState } from 'react'
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

export function Cards({ category, data, from = 0, len = Math.PI * 2, radius = 5.25, onPointerOver, onPointerOut, ...props }) {
    const [hovered, hover] = useState(null)
    const amount = Math.round(len * 14)
    const textPosition = from + len / 4
  
    return (
      <group {...props}>
        <Billboard
          position={[
            Math.sin(textPosition) * radius * 1.4, 
            1, 
            Math.cos(textPosition) * radius * 1.4
          ]}
        >
        <Text
          font={suspend(inter).default}
          fontSize={0.1}
          anchorX="left"
          color="black"
        >
          {category}
        </Text>
        </Billboard>
        {data.map((d, i) => {
          const angle = from + (i / amount) * len
          return (
            <Card
              key={angle}
              onPointerOver={(e) => (e.stopPropagation(), hover(d), onPointerOver(d))}
              onPointerOut={() => (hover(null), onPointerOut(null))}
              position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
              rotation={[0, Math.PI / 2 + angle, 0]}
              active={hovered !== null}
              hovered={hovered === d}
              url={d.image.url}
            />
          )
        })}
      </group>
    )
  }