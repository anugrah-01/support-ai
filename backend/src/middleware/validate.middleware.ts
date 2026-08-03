import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export const validatorMiddleware = (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") => (req: Request, res: Response, next: NextFunction) => {   // Middleware function to validate request body against the provided Zod schema
    try{ 
        const validatedData = schema.safeParse(req[source]);
        if(validatedData.success){
            req[source] = validatedData.data;  // Replace the request body with the validated data
            return next();
        } else {
            return res.status(400).json({ errors: validatedData.error.flatten() });
        }
    } catch (error : any) {
        return res.status(400).json({ errors: error.flatten() });
    }
};