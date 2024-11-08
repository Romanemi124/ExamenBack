import { MongoClient, ObjectId } from "mongodb";
import type { AutoresModel, LibroModel } from "./types.ts";
import { fromModelToLibro } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
    console.error("MONGODB_URI is not set");
    Deno.exit(1);
}

//Conectando con mongo
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Connected to MongoDB");

const db = client.db("backDB");

const autoresCollection = db.collection<AutoresModel>("autores");
const bookCollection = db.collection<LibroModel>("libros");

const handler = async (req: Request): Promise<Response> => {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    if (method === "/GET") {
        if (path === "/libros") {
            
            const titulo = url.searchParams.get("titulo");

            if (titulo) {
                const libroDB = await bookCollection.find({
                    titulo
                }).toArray();
                const libro = await Promise.all(
                    libroDB.map((l) => fromModelToLibro(l, autoresCollection))
                );
                return new Response(JSON.stringify(libro));
            } else {
                const libroDB = await bookCollection.find().toArray();
                const libro = await Promise.all(
                    libroDB.map((l) => fromModelToLibro(l, autoresCollection))
                );
                return new Response(JSON.stringify(libro));
            }
        } else if (path=== "/libro") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Bad request", {status: 400});
            const libroDB = await bookCollection.findOne({
                id
            });
            if (!libroDB) return new Response("No se encontraron libros con ese título.", {status: 404});
            const libro = await fromModelToLibro(libroDB, autoresCollection);
            return new Response(JSON.stringify(libro));
        }
    } else if (method === "/POST") {

        if (path === "/libro") {

            const libro = await req.json();
            if(!libro.titulo || !libro.copias) {
                return new Response("Faltan campos", {status: 400});
            }
            const libroDB = await bookCollection.findOne({
                titulo: libro.titulo
            });
            if (libroDB) return new Response("Libro ya existente", {status: 400});

            const {insertedId} = await bookCollection.insertOne({
                titulo: libro.titulo,
                copias: libro.copias,
                autores: [],
            });

            return new Response(
                JSON.stringify({
                    titulo: libro.titulo,
                    copias: libro.copias,
                    autores: [],
                    id: insertedId,
                }),
                {status:201}
            );

        } else if (path === "/autor") {
            
            const autor = await req.json();
            if(!autor.nombre || !autor.biografia) {
                return new Response("El nombre del autor y la biografía son campos requeridos.", {status: 400});
            }
            const autorDB = await autoresCollection.findOne({
                nombre: autor.nombre
            });
            if (autorDB) return new Response("Autor ya existente", {status: 400});

            const {insertedId} = await autoresCollection.insertOne({
                nombre: autor.nombre,
                biografia: autor.biografia,
            });

            return new Response(
                JSON.stringify({
                    nombre: autor.nombre,
                    biografia: autor.biografia,
                    id: insertedId,
                }),
                {status:201}
            );

        }

    } else if (method === "/PUT") {

        if (path === "/libro") {

            const libro = await req.json();
            if(!libro.titulo || !libro.copias || !libro.autores) {
                return new Response("Faltan campos", {status: 400});
            }

            if(libro.autores) {
                const autores = await autoresCollection.find({
                    _id: { $in: libro.autores.map((id: string) => new ObjectId(id))}
                }).toArray();

                if(autores.length !== libro.autores.length) {
                    return new Response("Autor no existe", {status: 404});
                }
            }

            const {modifiedCount} = await bookCollection.updateOne(
                { titulo: libro.titulo },
                { $set: { titulo: libro.titulo, copias: libro.copias, autores: libro.autores }},
            );

            if (modifiedCount === 0) {
                return new Response("El ID del libro no existe.", {status: 404});
            }
            return new Response("Libro modificado exitosamente", {status: 200});
        }
        
    } else if (method === "/DELETE") {
        
        if (path === "/libro") {
            const id = url.searchParams.get("id");
            if (!id) return new Response("Bad request", {status: 400});
            const { deletedCount } = await bookCollection.deleteOne({
                _id: new ObjectId(id)
            });

            if (deletedCount === 0) {
                return new Response("Libro no encontrado.", {status: 404});
            }
            return new Response("Libro eliminado exitosamente", {status: 200});
        }

    }

    return new Response("endpoint erroneo", {status: 200});

};

Deno.serve({port: 3000}, handler);