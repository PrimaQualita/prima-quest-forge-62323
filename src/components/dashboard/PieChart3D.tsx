import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface PieSlice {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

interface PieChart3DProps {
  data: PieSlice[];
}

function PieSlice3D({ 
  startAngle, 
  endAngle, 
  color, 
  label, 
  percentage 
}: { 
  startAngle: number; 
  endAngle: number; 
  color: string; 
  label: string; 
  percentage: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const radius = 2;
  const height = 0.5;
  const segments = 64;

  // Criar geometria do slice
  const shape = new THREE.Shape();
  const midAngle = (startAngle + endAngle) / 2;
  
  shape.moveTo(0, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    shape.lineTo(x, y);
  }
  shape.lineTo(0, 0);

  const extrudeSettings = {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
  };

  const offsetZ = hovered ? 0.3 : 0;
  const scale = hovered ? 1.05 : 1;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[0, 0, offsetZ]}
        scale={scale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      {percentage > 5 && (
        <Text
          position={[
            Math.cos(midAngle) * (radius * 0.6),
            Math.sin(midAngle) * (radius * 0.6),
            height + 0.1
          ]}
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="black"
        >
          {percentage}%
        </Text>
      )}
    </group>
  );
}

export function PieChart3D({ data }: PieChart3DProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;
  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    
    return {
      ...item,
      startAngle,
      endAngle,
    };
  });

  return (
    <div className="w-full h-[400px]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <group rotation={[-Math.PI / 6, 0, 0]}>
          {slices.map((slice, index) => (
            <PieSlice3D
              key={index}
              startAngle={slice.startAngle}
              endAngle={slice.endAngle}
              color={slice.fill}
              label={slice.name}
              percentage={slice.percentage}
            />
          ))}
        </group>
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={12}
        />
      </Canvas>
    </div>
  );
}
