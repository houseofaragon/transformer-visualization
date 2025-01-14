import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Image } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

export function Card({ url, active, hovered, ...props }) {
    const ref = useRef()

    useFrame((state, delta) => {
        const f = hovered ? 1.4 : active ? 1.25 : 1
        easing.damp3(ref.current.position, [0, hovered ? 0.5 : 0, 0], 0.1, delta)
        easing.damp3(ref.current.scale, [1.618 * f, 1 * f, 1], 0.15, delta)
    })

    return (
        <group {...props}>
        <Image
            ref={ref}
            transparent
            radius={0.075}
            url={url}
            scale={[1.618, 1, 1]}
            side={THREE.DoubleSide}
        />
        </group>
    )
}