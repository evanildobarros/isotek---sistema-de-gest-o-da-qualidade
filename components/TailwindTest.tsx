import React from 'react';

export const TailwindTest: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        ✅ Tailwind CSS
                    </h1>
                    <p className="text-gray-600">Configurado com sucesso!</p>
                </div>

                {/* Botão de exemplo conforme solicitado */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                    Botão Azul com Bordas Arredondadas
                </button>

                {/* Exemplos extras */}
                <div className="space-y-3">
                    <button className="w-full bg-isotek-600 hover:bg-isotek-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        Botão com Cor Isotek (Custom)
                    </button>

                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
                        Botão com Gradiente
                    </button>

                    <div className="flex gap-2">
                        <button className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-md transition-colors">
                            Confirmar
                        </button>
                        <button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-md transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                        Se você vê este card estilizado, o Tailwind está funcionando! 🎉
                    </p>
                </div>
            </div>
        </div>
    );
};
