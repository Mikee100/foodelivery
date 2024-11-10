import React from 'react';

const MealInfo = ({ meal }) => {
  return (
    <div className="flex flex-col items-center bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full transform transition-transform duration-300 hover:scale-105">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800 mb-6 tracking-tight">
          {meal.name}
        </h1>
        <div className="relative mb-8">
          <img
            src={meal.image}
            alt={meal.name}
            className="w-full h-80 md:h-96 object-cover rounded-xl shadow-md transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-black opacity-0 hover:opacity-40 transition-opacity duration-300 rounded-xl flex items-center justify-center text-white font-semibold text-2xl">
            <span>Ksh {meal.price}</span>
          </div>
        </div>
        <div className="text-gray-700 text-lg leading-relaxed mb-8 text-center px-4 md:px-8">
          {meal.description}
        </div>
        <div className="flex items-center justify-center">
          <span className="text-2xl font-semibold text-gray-800 bg-green-100 py-2 px-4 rounded-full shadow-lg tracking-wide">
            Price: <span className="text-green-600">Ksh {meal.price}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MealInfo;
