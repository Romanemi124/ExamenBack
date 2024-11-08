import type { Collection } from "mongodb";
import type { Libro, LibroModel, Autores, AutoresModel } from "./types.ts";

export const fromModelToLibro = async (
    libroDB: LibroModel,
    autoresCollection: Collection<AutoresModel>
): Promise<Libro> => {
    const autores = await autoresCollection
    .find({_id: {$in: libroDB.autores}}).toArray();

    return {
        id: libroDB._id!.toString(),
        titulo: libroDB.titulo,
        copias: libroDB.copias,
        autores: autores.map((a) => fromModelToAutor(a)),
    };
};

export const fromModelToAutor = (model: AutoresModel): Autores => ({
    id: model._id!.toString(),
    nombre: model.nombre,
    biografia: model.biografia,
});