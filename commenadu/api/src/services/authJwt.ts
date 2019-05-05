import passport from "passport";
import { Strategy as AnonymousStrategy } from "passport-anonymous";
import { ExtractJwt, Strategy } from "passport-jwt";
import { constants } from "../constants";
import { User } from "../entities";

const jwtOpts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: constants.JWT_SECRET,
};

// Optional, thus returns anonymous if unsuccessful
// Passes the buck down to the controllers
const jwtStrategy = new Strategy(jwtOpts, async (payload, done) => {
    const user = await User.findOne(payload.id);

    if (!user) {
        return done(null, false, { message: "Non-valid JWT or payload." });
    }
    return done(null, user);
});

passport.use(jwtStrategy);
passport.use(new AnonymousStrategy());
export const authJwt = passport.authenticate(["jwt", "anonymous"], { session: false });
