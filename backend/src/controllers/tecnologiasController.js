// src/controllers/tecnologiasController.js

import Tecnologia from '../models/Tecnologia.js';  // Suponiendo que tienes un modelo de 'Tecnologia'

// Obtener todas las tecnologías
export const getTecnologias = async (req, res) => {
  try {
    const tecnologias = await Tecnologia.find(); // Encontrar todas las tecnologías
    res.status(200).json(tecnologias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tecnologías", error });
  }
};

// Obtener una tecnología por su ID
export const getTecnologiaById = async (req, res) => {
  try {
    const tecnologia = await Tecnologia.findById(req.params.id);  // Buscar por id
    if (!tecnologia) {
      return res.status(404).json({ message: 'Tecnología no encontrada' });
    }
    res.status(200).json(tecnologia);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la tecnología", error });
  }
};

// Crear una nueva tecnología
export const createTecnologia = async (req, res) => {
  const { nombre, descripcion } = req.body; // Suponiendo que estos son los campos

  try {
    const nuevaTecnologia = new Tecnologia({ nombre, descripcion });
    await nuevaTecnologia.save(); // Guardar en la base de datos
    res.status(201).json(nuevaTecnologia);
  } catch (error) {
    res.status(500).json({ message: "Error al crear tecnología", error });
  }
};

// Actualizar una tecnología
export const updateTecnologia = async (req, res) => {
  try {
    const tecnologia = await Tecnologia.findByIdAndUpdate(req.params.id, req.body, { new: true });  // Actualiza y devuelve la versión actualizada
    if (!tecnologia) {
      return res.status(404).json({ message: 'Tecnología no encontrada' });
    }
    res.status(200).json(tecnologia);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar tecnología", error });
  }
};

// Eliminar una tecnología
export const deleteTecnologia = async (req, res) => {
  try {
    const tecnologia = await Tecnologia.findByIdAndDelete(req.params.id);
    if (!tecnologia) {
      return res.status(404).json({ message: 'Tecnología no encontrada' });
    }
    res.status(200).json({ message: 'Tecnología eliminada' });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar tecnología", error });
  }
};
