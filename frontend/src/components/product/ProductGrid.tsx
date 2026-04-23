'use client';

import React from 'react';
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';

interface ProductGridProps {
  products: any[];
  title?: string;
}

const ProductGrid = ({ products, title }: ProductGridProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="py-12">
      {title && (
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <button className="text-sm font-bold text-primary hover:underline">View All</button>
        </div>
      )}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2"
      >
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item}>
            <ProductCard key={product.id || index} {...product} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProductGrid;
