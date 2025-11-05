import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useMemo, useState } from 'react';
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
  percentage 
}: { 
  startAngle: number; 
  endAngle: number; 
  color: string; 
  percentage: number;
}) {
  const [hovered, setHovered] = useState(false);

  const geometry = useMemo(() => {
    const radius = 2.2;
    const height = 0.5;
    const segments = 64;

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
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 3,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [startAngle, endAngle]);

  const midAngle = (startAngle + endAngle) / 2;
  const offsetX = hovered ? Math.cos(midAngle) * 0.15 : 0;
  const offsetY = hovered ? Math.sin(midAngle) * 0.15 : 0;
  const scale = hovered ? 1.05 : 1;

  return (
    <group position={[offsetX, offsetY, 0]}>
      <mesh
        geometry={geometry}
        scale={scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color} 
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
      {percentage > 4 && (
        <Text
          position={[
            Math.cos(midAngle) * 1.4,
            Math.sin(midAngle) * 1.4,
            0.6
          ]}
          fontSize={0.25}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {percentage}%
        </Text>
      )}
    </group>
  );
}

export function PieChart3D({ data }: PieChart3DProps) {
  const slices = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    
    return data.map((item) => {
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
  }, [data]);

  return (
    <div className="w-full h-[420px]">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
        
        <group rotation={[-Math.PI / 6, 0, 0]}>
          {slices.map((slice, index) => (
            <PieSlice3D
              key={index}
              startAngle={slice.startAngle}
              endAngle={slice.endAngle}
              color={slice.fill}
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
