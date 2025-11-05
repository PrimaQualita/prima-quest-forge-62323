import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
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
  percentage,
  index 
}: { 
  startAngle: number; 
  endAngle: number; 
  color: string; 
  label: string; 
  percentage: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animação de entrada
  useFrame((state) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.08 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const radius = 2.5;
  const height = 0.6;
  const segments = 128;

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
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 5,
  };

  const offsetX = hovered ? Math.cos(midAngle) * 0.2 : 0;
  const offsetY = hovered ? Math.sin(midAngle) * 0.2 : 0;
  const offsetZ = hovered ? 0.2 : 0;

  return (
    <group position={[offsetX, offsetY, offsetZ]}>
      <mesh
        ref={meshRef}
        rotation={[0, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.2}
          roughness={0.3}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      {percentage > 3 && (
        <Text
          position={[
            Math.cos(midAngle) * (radius * 0.65),
            Math.sin(midAngle) * (radius * 0.65),
            height + 0.15
          ]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
          fontWeight="bold"
        >
          {percentage}%
        </Text>
      )}
    </group>
  );
}

function Scene({ data }: { data: PieSlice[] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Rotação suave automática
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += 0.001;
    }
  });

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
    <group ref={groupRef} rotation={[-Math.PI / 5, 0, 0]}>
      {slices.map((slice, index) => (
        <PieSlice3D
          key={index}
          index={index}
          startAngle={slice.startAngle}
          endAngle={slice.endAngle}
          color={slice.fill}
          label={slice.name}
          percentage={slice.percentage}
        />
      ))}
    </group>
  );
}

export function PieChart3D({ data }: PieChart3DProps) {
  return (
    <div className="w-full h-[450px] rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <color attach="background" args={['#f8fafc']} />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={0.8}
          castShadow
        />
        <directionalLight 
          position={[-10, -10, -5]} 
          intensity={0.3}
        />
        <pointLight position={[0, 0, 10]} intensity={0.5} />
        
        <Scene data={data} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={6}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          autoRotate={false}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
