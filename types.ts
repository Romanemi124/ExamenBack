import { ObjectId, type OptionalId } from "mongodb";

export type LibroModel = OptionalId<{
    titulo: string;
    copias: number;
    autores: ObjectId[];
}>;

export type AutoresModel = OptionalId<{
    nombre: string;
    biografia: string;
}>;

export type Libro = {
    id: string;
    titulo: string;
    copias: number;
    autores: Autores[];
};

export type Autores = {
    id: string;
    nombre: string;
    biografia: string;
};

