const swipl = require('swipl-stdio');
const engine = new swipl.Engine();
(async () => {
    const query = await engine.createQuery('member(X, [1,2,3,4])');
    try {
        let result;
        while (result = await query.next()) {
            console.log('PRROOOLLLOOOGGGG IS HEEEERRRRRREEEEEE')
            console.log(`Variable X value is: ${result.X}`);
        }
    } finally {
        await query.close();
    }
    engine.close();
})().catch((err) => console.log(err));