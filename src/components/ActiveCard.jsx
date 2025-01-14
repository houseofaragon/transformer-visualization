import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Image, Billboard, Text } from '@react-three/drei'
import { suspend } from 'suspend-react'
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

export function ActiveCard({ hovered, defaultHover, ...props }) {
    const ref = useRef()
    useLayoutEffect(() => void (ref.current.material.zoom = 0.8), [hovered])
    useFrame((state, delta) => {
      easing.damp(ref.current.material, 'zoom', 0.9, 0.9, delta)
      easing.damp(ref.current.material, 'opacity', hovered !== null, 0.3, delta)
    })
  
    return (
      <Billboard {...props}>
        <Text
          font={suspend(inter).default}
          fontSize={0.25}
          position={[2, 4.3, 0]}
          anchorX="left"
          color="#9D00FF"
        >
          {hovered && `${hovered.label}`}
        </Text>
        <Image
          ref={ref}
          transparent
          radius={0.3}
          position={[0, 1.5, 0]}
          scale={[8,5,1,1]}
          url={hovered ? hovered.image.url : defaultHover.image.url}
        />
      </Billboard>
    )
  }