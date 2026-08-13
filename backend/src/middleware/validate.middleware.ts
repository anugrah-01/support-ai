import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export const validatorMiddleware = (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") => (req: Request, res: Response, next: NextFunction) => {   // Middleware function to validate request body against the provided Zod schema
    console.log("VALIDATOR HIT", source);
    try{ 
        const validatedData = schema.safeParse(req[source]);
        if(!validatedData.success){            
            return res.status(400).json({ errors: validatedData.error.flatten() });
        }
        return next();
    } catch (error : any) {
        console.error("VALIDATOR ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};